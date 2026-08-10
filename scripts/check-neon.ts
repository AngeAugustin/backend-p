import { Client } from "pg";

const url =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_1bItRVmPdgk7@ep-falling-wildflower-au3ypauj-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const admins = await client.query(
    `SELECT id, email, "createdAt" FROM "AdminUser" LIMIT 5`
  );
  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM "AdminUser") AS admins,
      (SELECT COUNT(*)::int FROM "Project") AS projects,
      (SELECT COUNT(*)::int FROM "Article") AS articles,
      (SELECT COUNT(*)::int FROM "Service") AS services,
      (SELECT COUNT(*)::int FROM "ContactMessage") AS messages
  `);

  console.log("tables:", tables.rows.map((r) => r.table_name));
  console.log("counts:", counts.rows[0]);
  console.log("admins:", admins.rows);
  await client.end();
}

main().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});
