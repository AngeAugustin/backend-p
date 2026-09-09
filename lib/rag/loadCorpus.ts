import { loadContentFiles, type ContentFile } from "@/lib/content/collectMarkdown";
import {
  loadDatabaseContentFiles,
  trimAboutMarkdownForDatabase,
} from "@/lib/rag/fromDatabase";
import type { Locale } from "@/lib/types";

export interface CorpusLoadResult {
  files: ContentFile[];
  markdownFiles: number;
  databaseFiles: number;
  counts: {
    projects: number;
    experiences: number;
    educations: number;
    services: number;
    articles: number;
  };
}

/**
 * Builds the RAG corpus from markdown (skills/about) + published Prisma rows.
 * When DB projects exist, markdown projects are skipped to avoid stale duplicates.
 */
export async function loadRagCorpus(
  locales: Locale[] = ["fr", "en"],
): Promise<CorpusLoadResult> {
  const [markdownFiles, database] = await Promise.all([
    loadContentFiles(locales),
    loadDatabaseContentFiles(locales),
  ]);

  const hasDbProjects = database.counts.projects > 0;
  const hasDbExperiences = database.counts.experiences > 0;
  const hasDbEducations = database.counts.educations > 0;

  const filteredMarkdown = markdownFiles
    .filter((file) => {
      if (hasDbProjects && file.source.includes("/projects/")) {
        return false;
      }
      return true;
    })
    .map((file) => {
      if (!file.source.endsWith("/about.md") && !file.source.endsWith("about.md")) {
        return file;
      }

      return {
        ...file,
        raw: trimAboutMarkdownForDatabase(file.raw, {
          hasExperiences: hasDbExperiences,
          hasEducations: hasDbEducations,
        }),
      };
    });

  return {
    files: [...filteredMarkdown, ...database.files],
    markdownFiles: filteredMarkdown.length,
    databaseFiles: database.files.length,
    counts: database.counts,
  };
}
