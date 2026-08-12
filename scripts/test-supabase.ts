import { config } from "dotenv";

import { getSupabaseAdmin } from "../lib/supabase";

config({ path: ".env.local" });

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("❌ Missing Supabase credentials in .env.local");
    console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  console.log("🔌 Testing Supabase connection…");
  console.log(`   URL: ${url}\n`);

  const supabase = getSupabaseAdmin();

  // 1. Table check
  const { error: tableError, count } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  if (tableError) {
    console.error("❌ Table document_chunks — NOT FOUND");
    console.error(`   Error: ${tableError.message}`);
    console.error("\n→ Run supabase/setup-complete.sql in Supabase SQL Editor");
    process.exit(1);
  }

  console.log("✅ Table document_chunks exists");
  console.log(`   rows: ${count ?? 0}`);

  // 2. RPC check
  const zeroVector = Array.from({ length: 1536 }, () => 0);
  const { data, error: rpcError } = await supabase.rpc("match_documents", {
    query_embedding: zeroVector,
    match_count: 1,
    match_threshold: 0,
    filter_locale: null,
  });

  if (rpcError) {
    console.error("\n❌ RPC match_documents — FAILED");
    console.error(`   Error: ${rpcError.message}`);
    console.error("\n→ Run supabase/setup-complete.sql in Supabase SQL Editor");
    console.error("  (Then: Settings → API → Reload schema cache if needed)");
    process.exit(1);
  }

  console.log("✅ RPC match_documents works");
  console.log(`   test results: ${data?.length ?? 0} row(s)`);

  if ((count ?? 0) === 0) {
    console.log("\nℹ️  Table is empty — run npm run ingest in Phase 4");
  }

  console.log("\nPhase 3 setup verified.");
}

main();
