import { loadContentFiles, CONTENT_DIR } from "@/lib/content/collectMarkdown";
import type { Locale } from "@/lib/types";

const knowledgeCache = new Map<Locale, string>();

export async function loadKnowledgeBase(locale: Locale): Promise<string> {
  const cached = knowledgeCache.get(locale);
  if (cached) {
    return cached;
  }

  const files = (await loadContentFiles([locale])).sort((a, b) =>
    a.source.localeCompare(b.source),
  );
  const sections: string[] = [];

  for (const file of files) {
    sections.push(`## Source: ${file.source}\n\n${file.raw.trim()}`);
  }

  const knowledgeBase = sections.join("\n\n---\n\n");
  knowledgeCache.set(locale, knowledgeBase);

  return knowledgeBase;
}

export function clearKnowledgeCache(): void {
  knowledgeCache.clear();
}

export { CONTENT_DIR, loadContentFiles };
