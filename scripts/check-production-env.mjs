#!/usr/bin/env node
/**
 * Validates that production env vars look present (does not call external APIs).
 * Usage: node scripts/check-production-env.mjs
 *        node scripts/check-production-env.mjs --strict
 */
const strict = process.argv.includes("--strict");

const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_API_URL",
];

const recommended = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
];

let failed = false;

console.log("2dcite production env check\n");

for (const key of required) {
  const v = process.env[key];
  if (!v) {
    console.error(`✗ MISSING required: ${key}`);
    failed = true;
  } else if (key === "AUTH_SECRET" && v.length < 32) {
    console.error(`✗ AUTH_SECRET too short (use openssl rand -hex 32)`);
    failed = true;
  } else if (
    key === "DATABASE_URL" &&
    v.startsWith("file:") &&
    process.env.VERCEL
  ) {
    console.error(`✗ DATABASE_URL is SQLite file: — use Postgres on Vercel`);
    failed = true;
  } else {
    console.log(`✓ ${key}`);
  }
}

for (const key of recommended) {
  if (!process.env[key]) {
    console.warn(`! recommended missing: ${key}`);
    if (strict) failed = true;
  } else {
    console.log(`✓ ${key}`);
  }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
if (appUrl && !appUrl.startsWith("https://") && process.env.VERCEL_ENV === "production") {
  console.error("✗ NEXT_PUBLIC_APP_URL should be https:// in production");
  failed = true;
}

if (process.env.VERCEL_ENV === "production" && !process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "! No STRIPE_SECRET_KEY — production checkout will fail unless ALLOW_DEV_MOCK_PAY=true"
  );
}

console.log(failed ? "\nFailed." : "\nOK (or warnings only).");
process.exit(failed ? 1 : 0);
