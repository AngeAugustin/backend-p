import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.production.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("NO_DATABASE_URL");
    process.exit(1);
  }

  const host = url.split("@")[1]?.split("/")[0] || "unknown";
  console.log("host", host.split(":")[0]);

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  console.log("tables:");
  for (const row of tables.rows) {
    console.log("-", row.tablename);
  }
  const invoices = await client.query(
    `SELECT to_regclass('public."ProformaInvoice"') AS invoice, to_regclass('public."ProformaInvoiceItem"') AS item`
  );
  console.log("proforma", invoices.rows[0]);
  await client.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
