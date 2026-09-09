import { clearFaqCache } from "@/lib/chat/faq";
import { clearKnowledgeCache } from "@/lib/content/loadKnowledge";
import { getGeminiApiKeys } from "@/lib/gemini";
import { chunkAllContentFiles } from "@/lib/rag/chunk";
import { embedTextsInBatches } from "@/lib/rag/embed";
import { loadRagCorpus } from "@/lib/rag/loadCorpus";
import {
  clearDocumentChunks,
  getDocumentChunkCount,
  insertDocumentChunks,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { Locale } from "@/lib/types";

export interface IngestResult {
  files: number;
  markdownFiles: number;
  databaseFiles: number;
  chunks: number;
  indexed: number;
  counts: {
    projects: number;
    experiences: number;
    educations: number;
    services: number;
    articles: number;
  };
}

export function assertIngestConfigured(): void {
  if (getGeminiApiKeys().length === 0) {
    throw new Error("GEMINI_API_KEYS / GEMINI_API_KEY is not configured");
  }
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
}

export async function runRagIngest(
  locales: Locale[] = ["fr", "en"],
): Promise<IngestResult> {
  assertIngestConfigured();

  const corpus = await loadRagCorpus(locales);
  if (corpus.files.length === 0) {
    throw new Error("No corpus files found (markdown + database)");
  }

  const chunks = chunkAllContentFiles(corpus.files);
  if (chunks.length === 0) {
    throw new Error("No chunks produced from corpus");
  }

  const embeddings = await embedTextsInBatches(
    chunks.map((chunk) => chunk.content),
  );

  await clearDocumentChunks();
  await insertDocumentChunks(
    chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embeddings[index],
    })),
  );

  clearKnowledgeCache();
  clearFaqCache();

  const indexed = await getDocumentChunkCount();

  return {
    files: corpus.files.length,
    markdownFiles: corpus.markdownFiles,
    databaseFiles: corpus.databaseFiles,
    chunks: chunks.length,
    indexed,
    counts: corpus.counts,
  };
}
