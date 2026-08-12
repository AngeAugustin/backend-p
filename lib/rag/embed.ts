import {
  EMBEDDING_MODEL,
  withGeminiKeys,
} from "@/lib/gemini";
import { isGeminiRateLimitError } from "@/lib/gemini/errors";
import { EMBEDDING_DIMENSIONS } from "@/lib/rag/types";

export { EMBEDDING_MODEL };

/** Gemini free tier: ~100 embed requests/min — each text counts as 1 request. */
export const EMBEDDING_BATCH_SIZE = 20;
const FREE_TIER_REQUESTS_PER_MINUTE = 80;
const RATE_WINDOW_MS = 60_000;
const MAX_RETRIES = 5;

let windowStart = Date.now();
let requestsInWindow = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForQuota(requestCount: number): Promise<void> {
  if (requestsInWindow + requestCount <= FREE_TIER_REQUESTS_PER_MINUTE) {
    return;
  }

  const elapsed = Date.now() - windowStart;
  const waitMs = RATE_WINDOW_MS - elapsed + 1000;

  if (waitMs > 0) {
    console.log(
      `   ⏳ Gemini rate limit — pause ${Math.ceil(waitMs / 1000)}s (${requestsInWindow}/${FREE_TIER_REQUESTS_PER_MINUTE} req/min)…`,
    );
    await sleep(waitMs);
  }

  windowStart = Date.now();
  requestsInWindow = 0;
}

function recordRequests(requestCount: number): void {
  requestsInWindow += requestCount;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  requestCount: number,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await waitForQuota(requestCount);
      const result = await operation();
      recordRequests(requestCount);
      return result;
    } catch (error) {
      if (!isGeminiRateLimitError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const waitMs = 65_000;
      console.log(
        `   ⏳ All keys busy — retry ${attempt}/${MAX_RETRIES} in ${waitMs / 1000}s…`,
      );
      await sleep(waitMs);
      windowStart = Date.now();
      requestsInWindow = 0;
    }
  }

  throw new Error("Embedding request failed after retries");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  return withRetry(async () => {
    const response = await withGeminiKeys((ai) =>
      ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      }),
    );

    const embeddings = (response.embeddings ?? []).map(
      (item) => item.values ?? [],
    );

    if (embeddings.length !== texts.length) {
      throw new Error(
        `Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`,
      );
    }

    for (const embedding of embeddings) {
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Unexpected embedding size: ${embedding.length} (expected ${EMBEDDING_DIMENSIONS})`,
        );
      }
    }

    return embeddings;
  }, texts.length);
}

export async function embedTextsInBatches(
  texts: string[],
  batchSize = EMBEDDING_BATCH_SIZE,
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];
  const totalBatches = Math.ceil(texts.length / batchSize);

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    const embeddings = await embedTexts(batch);
    allEmbeddings.push(...embeddings);

    const batchNumber = Math.floor(index / batchSize) + 1;
    console.log(
      `   Embeddings batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`,
    );
  }

  return allEmbeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const embeddings = await withRetry(async () => {
    const response = await withGeminiKeys((ai) =>
      ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [text],
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_QUERY",
        },
      }),
    );

    return (response.embeddings ?? []).map((item) => item.values ?? []);
  }, 1);

  const embedding = embeddings[0] ?? [];

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected query embedding size: ${embedding.length} (expected ${EMBEDDING_DIMENSIONS})`,
    );
  }

  return embedding;
}

/** Reset rate-limit window (useful in tests). */
export function resetEmbeddingRateLimit(): void {
  windowStart = Date.now();
  requestsInWindow = 0;
}
