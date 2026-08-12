import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { Locale } from "@/lib/types";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export interface ContentFile {
  locale: Locale;
  source: string;
  raw: string;
}

async function collectMarkdownPaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownPaths(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

export async function loadContentFiles(
  locales: Locale[] = ["fr", "en"],
): Promise<ContentFile[]> {
  const results: ContentFile[] = [];

  for (const locale of locales) {
    const localeDir = path.join(CONTENT_DIR, locale);
    const filePaths = await collectMarkdownPaths(localeDir);

    for (const filePath of filePaths) {
      const source = path.relative(CONTENT_DIR, filePath).replaceAll("\\", "/");
      const raw = await readFile(filePath, "utf8");
      results.push({ locale, source, raw });
    }
  }

  return results;
}
