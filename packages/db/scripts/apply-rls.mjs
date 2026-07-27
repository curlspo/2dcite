/**
 * Apply packages/db/prisma/sql/rls.sql to DATABASE_URL.
 * Usage: node scripts/apply-rls.mjs   (from packages/db) or pnpm --filter @2dcite/db rls:apply
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../prisma/sql/rls.sql");

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("file:")) {
  console.error("DATABASE_URL must be a PostgreSQL URL (not SQLite).");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString: url });

try {
  await client.connect();
  await client.query(sql);
  console.log("RLS policies applied successfully from", sqlPath);
} catch (e) {
  console.error("Failed to apply RLS:", e.message || e);
  process.exit(1);
} finally {
  await client.end();
}
