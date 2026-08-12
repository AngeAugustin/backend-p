import { config } from "dotenv";

import { loadContentFiles } from "@/lib/content/collectMarkdown";
import { clearKnowledgeCache } from "@/lib/content/loadKnowledge";
import { getGeminiApiKeys } from "@/lib/gemini";
import { chunkAllContentFiles } from "@/lib/rag/chunk";
import { embedTextsInBatches } from "@/lib/rag/embed";
import {
  clearDocumentChunks,
  getDocumentChunkCount,
  insertDocumentChunks,
} from "@/lib/supabase";

config({ path: ".env.local" });

async function main() {
  const geminiKeys = getGeminiApiKeys();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (geminiKeys.length === 0 || !supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables in .env.local");
    console.error("   Required: GEMINI_API_KEYS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  console.log("📚 Portfolio Chatbot — Ingestion (Phase 4)\n");

  console.log("1/5 Loading markdown files…");
  const files = await loadContentFiles(["fr", "en"]);
  console.log(`   ${files.length} files loaded\n`);

  console.log("2/5 Chunking content…");
  const chunks = chunkAllContentFiles(files);
  const byLocale = {
    fr: chunks.filter((chunk) => chunk.metadata.locale === "fr").length,
    en: chunks.filter((chunk) => chunk.metadata.locale === "en").length,
  };
  console.log(`   ${chunks.length} chunks (${byLocale.fr} FR, ${byLocale.en} EN)\n`);

  if (chunks.length === 0) {
    console.error("❌ No chunks produced — check content/ folder");
    process.exit(1);
  }

  console.log("3/5 Generating embeddings (Gemini)…");
  const embeddings = await embedTextsInBatches(chunks.map((chunk) => chunk.content));
  console.log(`   ${embeddings.length} embeddings generated\n`);

  console.log("4/5 Clearing existing chunks in Supabase…");
  await clearDocumentChunks();
  console.log("   Table cleared\n");

  console.log("5/5 Inserting chunks into Supabase…");
  await insertDocumentChunks(
    chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embeddings[index],
    })),
  );

  clearKnowledgeCache();

  const total = await getDocumentChunkCount();
  console.log(`\n✅ Ingestion complete — ${total} chunks indexed`);
  console.log("ℹ️  Optional: run supabase/indexes-after-ingest.sql for faster vector search");
}

main().catch((error) => {
  console.error("\n❌ Ingestion failed:");

  if (isRateLimitError(error)) {
    console.error("   Gemini quota exceeded (free tier: ~100 embeddings/min).");
    console.error("   Wait 1 minute and re-run: npm run ingest");
    console.error("   The script now auto-pauses — this error means retries were exhausted.");
  } else if (error instanceof Error) {
    console.error(`   ${error.message}`);
  } else {
    console.error(error);
  }

  process.exit(1);
});

function isRateLimitError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
}
