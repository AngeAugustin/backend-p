import { Client } from "pg";

const host = process.env.PGHOST || "127.0.0.1";
const port = Number(process.env.PGPORT || 5432);
const user = process.env.PGUSER || "postgres";
const password = process.env.PGPASSWORD || "postgres";
const database = process.env.PGDATABASE || "portfolio_api";

async function main() {
  const client = new Client({
    host,
    port,
    user,
    password,
    database: "postgres",
  });

  await client.connect();
  const existing = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [database]
  );

  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${database}"`);
    console.log(`Created database ${database}`);
  } else {
    console.log(`Database ${database} already exists`);
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
