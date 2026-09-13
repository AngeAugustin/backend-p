import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log(
    "host:",
    url.replace(/:[^:@/]+@/, ":****@"),
  );
  console.log(
    "tables:",
    tables.rows.map((row: { table_name: string }) => row.table_name),
  );
  await client.end();
}

main().catch((error) => {
  console.error("FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
