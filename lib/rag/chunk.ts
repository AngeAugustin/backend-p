import { parseFrontmatter, extractSectionTitle } from "@/lib/content/parseMarkdown";
import type { ChunkMetadata } from "@/lib/rag/types";

import type { ContentFile } from "@/lib/content/collectMarkdown";

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

const TARGET_CHUNK_SIZE = 1500;
const MAX_CHUNK_SIZE = 2000;
const OVERLAP_SIZE = 200;

const VALID_TYPES = new Set<ChunkMetadata["type"]>([
  "about",
  "skills",
  "project",
  "faq",
  "unknown",
]);

function inferContentType(
  source: string,
  frontmatter: Record<string, string>,
): ChunkMetadata["type"] {
  const fromFrontmatter = frontmatter.type as ChunkMetadata["type"] | undefined;
  if (fromFrontmatter && VALID_TYPES.has(fromFrontmatter)) {
    return fromFrontmatter;
  }

  if (source.includes("/projects/")) return "project";
  if (source.endsWith("/about.md") || source.endsWith("about.md")) return "about";
  if (source.endsWith("/skills.md") || source.endsWith("skills.md")) return "skills";
  if (source.endsWith("/faq.md") || source.endsWith("faq.md")) return "faq";

  return "unknown";
}

function buildAboutContextPrefix(
  frontmatter: Record<string, string>,
  locale: string,
): string {
  const name = frontmatter.name?.trim();
  const title = frontmatter.title?.trim();
  const location = frontmatter.location?.trim();
  const email = frontmatter.email?.trim();

  if (!name && !location && !email) {
    return "";
  }

  const identity = [name, title].filter(Boolean).join(" — ");
  const isFrench = locale === "fr";

  const locationLine = location
    ? isFrench
      ? `Basé à ${location}.`
      : `Based in ${location}.`
    : "";
  const contactLine = email
    ? isFrench
      ? `Contact : ${email}.`
      : `Contact: ${email}.`
    : "";

  const label = isFrench ? "Profil" : "Profile";
  const summary = [identity, locationLine, contactLine].filter(Boolean).join(" ");

  return `${label}: ${summary}\n\n`;
}

function splitIntoSections(body: string): string[] {
  const sections = body
    .split(/(?=^#{2,3}\s)/m)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.length > 0 ? sections : [body.trim()];
}

function splitOversizedSection(text: string): string[] {
  if (text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= TARGET_CHUNK_SIZE) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current.trim());
    }

    if (paragraph.length > MAX_CHUNK_SIZE) {
      let start = 0;
      while (start < paragraph.length) {
        const end = Math.min(start + MAX_CHUNK_SIZE, paragraph.length);
        chunks.push(paragraph.slice(start, end).trim());
        start = Math.max(end - OVERLAP_SIZE, start + 1);
      }
      current = "";
      continue;
    }

    current = paragraph;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return applyOverlap(chunks);
}

function applyOverlap(chunks: string[]): string[] {
  if (chunks.length <= 1) {
    return chunks;
  }

  const overlapped: string[] = [chunks[0]];

  for (let index = 1; index < chunks.length; index += 1) {
    const previous = chunks[index - 1];
    const overlap = previous.slice(-OVERLAP_SIZE);
    overlapped.push(`${overlap}\n\n${chunks[index]}`.trim());
  }

  return overlapped;
}

export function chunkContentFile(file: ContentFile): TextChunk[] {
  const { frontmatter, body } = parseFrontmatter(file.raw);
  const type = inferContentType(file.source, frontmatter);
  const aboutPrefix =
    type === "about" ? buildAboutContextPrefix(frontmatter, file.locale) : "";
  const sections = splitIntoSections(`${aboutPrefix}${body}`);
  const chunks: TextChunk[] = [];

  for (const section of sections) {
    const sectionTitle = extractSectionTitle(section);
    const parts = splitOversizedSection(section);

    for (const part of parts) {
      const content = part.trim();
      if (!content) continue;

      chunks.push({
        content,
        metadata: {
          locale: file.locale,
          source: file.source,
          section: sectionTitle,
          type,
        },
      });
    }
  }

  return chunks;
}

export function chunkAllContentFiles(files: ContentFile[]): TextChunk[] {
  return files.flatMap(chunkContentFile);
}

export const chunkConfig = {
  TARGET_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  OVERLAP_SIZE,
} as const;
