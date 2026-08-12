import { embedQuery } from "@/lib/rag/embed";
import { RAG_CONFIG } from "@/lib/rag/config";
import type { MatchDocumentResult } from "@/lib/rag/types";
import { matchDocuments } from "@/lib/supabase";
import type { Locale } from "@/lib/types";

export interface RetrieveOptions {
  matchCount?: number;
  matchThreshold?: number;
}

export async function retrieveRelevantChunks(
  query: string,
  locale: Locale,
  options: RetrieveOptions = {},
): Promise<MatchDocumentResult[]> {
  const matchCount = options.matchCount ?? RAG_CONFIG.matchCount;
  const matchThreshold = options.matchThreshold ?? RAG_CONFIG.matchThreshold;
  const fallbackThreshold = RAG_CONFIG.fallbackMatchThreshold;

  const queryEmbedding = await embedQuery(query);

  let results = await matchDocuments({
    queryEmbedding,
    matchCount,
    matchThreshold,
    locale,
  });

  if (results.length === 0 && matchThreshold > fallbackThreshold) {
    results = await matchDocuments({
      queryEmbedding,
      matchCount,
      matchThreshold: fallbackThreshold,
      locale,
    });
  }

  return results;
}

export { RAG_CONFIG };
