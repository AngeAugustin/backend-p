import type { Locale } from "@/lib/types";

export const EMBEDDING_DIMENSIONS = 1536;

export interface ChunkMetadata {
  locale: Locale;
  source: string;
  section: string;
  type: "about" | "skills" | "project" | "faq" | "unknown";
}

export interface DocumentChunkRow {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding: number[] | null;
  created_at: string;
}

export interface MatchDocumentResult {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
}

export interface MatchDocumentsParams {
  queryEmbedding: number[];
  matchCount?: number;
  matchThreshold?: number;
  locale?: Locale;
}
