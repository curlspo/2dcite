import { NextResponse } from "next/server";
import type { HealthResponse } from "@2dcite/shared";
import { storageMode } from "@/lib/storage";
import { stripeEnabled } from "@/lib/payments";
import { rateLimitBackend } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public health — booleans only. Never return key material, partial keys, or
 * config that helps attackers (e.g. which secret is missing).
 */
export async function GET() {
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  let db: "ok" | "error" | "skipped" = "skipped";
  try {
    if (process.env.DATABASE_URL) {
      const { prisma } = await import("@2dcite/db");
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } else {
      db = "skipped";
    }
  } catch {
    db = "error";
  }

  const body = {
    ok: true as const,
    service: "2dcite-api" as const,
    version: "0.2.0",
    time: new Date().toISOString(),
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    // Coarse operational flags only — no secret presence details in production
    storage: storageMode() === "blob-private" ? "blob" : "local",
    rateLimit: rateLimitBackend(),
    stripe: stripeEnabled(),
    db,
    ...(isProd
      ? {}
      : {
          // Dev-only diagnostics (still never returns key values)
          hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        }),
  } satisfies HealthResponse & Record<string, unknown>;

  const status = db === "error" ? 503 : 200;
  return NextResponse.json(body, { status });
}
