import { config } from "dotenv";
import { Client } from "pg";

const envFile = process.argv[2];
if (envFile) {
  config({ path: envFile, override: true });
}

const url = process.env.DATABASE_URL;

function redact(value?: string) {
  if (!value) return "(missing)";
  return value.replace(/:[^:@/]+@/, ":****@");
}

async function main() {
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: /neon\.tech|sslmode=require/i.test(url)
      ? { rejectUnauthorized: false }
      : undefined,
  });
  await client.connect();

  const tables = await client.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const invoiceTables = tables.rows.filter((row) =>
    /proforma|invoice/i.test(row.table_name),
  );

  console.log("host:", redact(url));
  console.log("all_tables:", tables.rows.map((row) => row.table_name));
  console.log(
    "invoice_tables:",
    invoiceTables.map((row) => row.table_name),
  );
  await client.end();
}

main().catch((error) => {
  console.error("FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
