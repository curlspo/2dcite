/**
 * Scan Next.js client bundles for secret-looking material.
 * Run after: pnpm --filter @2dcite/web build
 *
 * Usage: node scripts/assert-no-client-secrets.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd(), "apps/web/.next");
const TARGETS = [
  join(ROOT, "static"),
  join(ROOT, "server", "app"), // also check we don't embed in shared chunks incorrectly
];

const FORBIDDEN = [
  /sk_live_[A-Za-z0-9]{10,}/,
  /sk_test_[A-Za-z0-9]{10,}/,
  /whsec_[A-Za-z0-9]{10,}/,
  /rk_live_[A-Za-z0-9]{10,}/,
  /rk_test_[A-Za-z0-9]{10,}/,
  /STRIPE_SECRET_KEY\s*[:=]/,
  /STRIPE_WEBHOOK_SECRET\s*[:=]/,
  /DATABASE_URL\s*[:=]\s*["']?postgresql/i,
  /BLOB_READ_WRITE_TOKEN\s*[:=]/,
  /RESEND_API_KEY\s*[:=]/,
  /MFA_ENCRYPTION_KEY\s*[:=]/,
  /UPSTASH_REDIS_REST_TOKEN\s*[:=]/,
  /BEGIN (RSA |OPENSSH )?PRIVATE KEY/,
];

// Client-only: static chunks + browser-facing
const CLIENT_DIRS = [join(ROOT, "static")];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(js|css|html|map)$/.test(name)) files.push(p);
  }
  return files;
}

const files = CLIENT_DIRS.flatMap((d) => walk(d));
if (files.length === 0) {
  console.error(
    "No client build output found under apps/web/.next/static — run a production build first."
  );
  process.exit(1);
}

let failed = false;
for (const file of files) {
  // Skip source maps for secret scan of names, but still scan content
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const re of FORBIDDEN) {
    if (re.test(text)) {
      console.error(`FORBIDDEN pattern ${re} in ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("Client secret scan FAILED");
  process.exit(1);
}

console.log(
  `Client secret scan OK (${files.length} files under apps/web/.next/static)`
);
