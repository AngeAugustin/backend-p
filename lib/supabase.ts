import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  ChunkMetadata,
  MatchDocumentResult,
  MatchDocumentsParams,
} from "@/lib/rag/types";

export interface DocumentChunkInsert {
  content: string;
  metadata: ChunkMetadata;
  embedding: number[];
}

let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment",
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export async function getDocumentChunkCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count document_chunks: ${error.message}`);
  }

  return count ?? 0;
}

const INSERT_BATCH_SIZE = 50;

export async function clearDocumentChunks(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("document_chunks")
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new Error(`Failed to clear document_chunks: ${error.message}`);
  }
}

export async function insertDocumentChunks(
  chunks: DocumentChunkInsert[],
): Promise<void> {
  const supabase = getSupabaseAdmin();

  for (let index = 0; index < chunks.length; index += INSERT_BATCH_SIZE) {
    const batch = chunks.slice(index, index + INSERT_BATCH_SIZE);
    const { error } = await supabase.from("document_chunks").insert(batch);

    if (error) {
      throw new Error(
        `Failed to insert document_chunks batch ${Math.floor(index / INSERT_BATCH_SIZE) + 1}: ${error.message}`,
      );
    }

    console.log(
      `   Inserted batch ${Math.floor(index / INSERT_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / INSERT_BATCH_SIZE)} (${batch.length} chunks)`,
    );
  }
}

export async function matchDocuments({
  queryEmbedding,
  matchCount = 5,
  matchThreshold = 0.5,
  locale,
}: MatchDocumentsParams): Promise<MatchDocumentResult[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
    filter_locale: locale ?? null,
  });

  if (error) {
    throw new Error(`match_documents RPC failed: ${error.message}`);
  }

  return (data ?? []).map(
    (row: {
      id: string;
      content: string;
      metadata: ChunkMetadata;
      similarity: number;
    }) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
    }),
  );
}

export async function verifySupabaseSetup(): Promise<{
  connected: boolean;
  chunkCount: number;
  rpcAvailable: boolean;
  rpcError?: string;
}> {
  const chunkCount = await getDocumentChunkCount();

  const zeroVector = Array.from({ length: 1536 }, () => 0);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.rpc("match_documents", {
    query_embedding: zeroVector,
    match_count: 1,
    match_threshold: 0,
    filter_locale: null,
  });

  return {
    connected: true,
    chunkCount,
    rpcAvailable: !error,
    rpcError: error?.message,
  };
}
