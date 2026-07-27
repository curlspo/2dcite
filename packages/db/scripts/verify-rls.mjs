/**
 * Smoke-test RLS policies against DATABASE_URL.
 * Usage: node scripts/verify-rls.mjs
 */
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("file:")) {
  console.error("DATABASE_URL must be PostgreSQL");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

async function setCtx({ userId = "", role = "", bypass = false } = {}) {
  // Match app runtime: drop to non-bypass role so RLS policies apply
  await client.query(`SET LOCAL ROLE twodcite_app`);
  await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
  await client.query(`SELECT set_config('app.user_role', $1, true)`, [role]);
  await client.query(`SELECT set_config('app.rls_bypass', $1, true)`, [
    bypass ? "on" : "off",
  ]);
}

async function count(table) {
  const r = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
  return r.rows[0].n;
}

try {
  await client.connect();

  // Policy inventory
  const policies = await client.query(`
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE 'rls_%'
    ORDER BY tablename, cmd, policyname
  `);
  console.log(`Policies: ${policies.rowCount}`);

  // Deny context → zero jobs
  await client.query("BEGIN");
  await setCtx({ userId: "__none__", role: "NONE", bypass: false });
  const denyJobs = await count("Job");
  await client.query("ROLLBACK");
  console.log(`Deny context Job count: ${denyJobs} (expect 0)`);

  // Bypass → may see rows
  await client.query("BEGIN");
  await setCtx({ bypass: true });
  const bypassJobs = await count("Job");
  const bypassUsers = await count("User");
  await client.query("ROLLBACK");
  console.log(`Bypass Job count: ${bypassJobs}, User count: ${bypassUsers}`);

  // Random user → only own rows (likely 0 jobs)
  await client.query("BEGIN");
  await setCtx({ userId: "user_does_not_exist", role: "ATTORNEY", bypass: false });
  const strangerJobs = await count("Job");
  const strangerUsers = await count("User");
  await client.query("ROLLBACK");
  console.log(
    `Stranger Job count: ${strangerJobs} (expect 0), User count: ${strangerUsers} (expect 0)`
  );

  // If we have a real user, scope to them
  await client.query("BEGIN");
  await setCtx({ bypass: true });
  const sample = await client.query(
    `SELECT id, role::text FROM "User" WHERE role IN ('ATTORNEY','JUDGE') LIMIT 1`
  );
  await client.query("ROLLBACK");

  if (sample.rows[0]) {
    const { id, role } = sample.rows[0];
    await client.query("BEGIN");
    await setCtx({ userId: id, role, bypass: false });
    const ownJobs = await client.query(
      `SELECT count(*)::int AS n FROM "Job" WHERE "clientId" = $1`,
      [id]
    );
    const visibleJobs = await count("Job");
    await client.query("ROLLBACK");
    console.log(
      `Client ${id.slice(0, 8)}… own jobs: ${ownJobs.rows[0].n}, visible under RLS: ${visibleJobs}`
    );
    if (visibleJobs !== ownJobs.rows[0].n) {
      console.error("FAIL: visible jobs != own jobs for client");
      process.exit(1);
    }
  }

  if (denyJobs !== 0 || strangerJobs !== 0 || strangerUsers !== 0) {
    console.error("FAIL: unauthenticated/stranger could see rows");
    process.exit(1);
  }

  console.log("RLS verify OK");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await client.end();
}
