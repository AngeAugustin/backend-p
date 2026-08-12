export const RAG_CONFIG = {
  /** Number of chunks retrieved per query */
  matchCount: 5,
  /** Primary similarity threshold (cosine, 0–1) */
  matchThreshold: 0.45,
  /** Fallback threshold when primary returns no results */
  fallbackMatchThreshold: 0.32,
} as const;

export type RagConfig = typeof RAG_CONFIG;
