import { config } from "dotenv";

import { runRagIngest } from "@/lib/rag/runIngest";

config({ path: ".env.local" });

async function main() {
  console.log("📚 Portfolio Chatbot — Ingestion (DB + markdown)\n");

  console.log("1/3 Loading corpus (markdown + published DB rows)…");
  const result = await runRagIngest(["fr", "en"]);

  console.log(`   ${result.files} files (${result.markdownFiles} markdown, ${result.databaseFiles} from DB)`);
  console.log(
    `   DB: ${result.counts.projects} projects, ${result.counts.experiences} experiences, ${result.counts.educations} educations, ${result.counts.services} services, ${result.counts.articles} articles`,
  );
  console.log(`   ${result.chunks} chunks embedded and indexed\n`);

  console.log(`✅ Ingestion complete — ${result.indexed} chunks in Supabase`);
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
