import { NextResponse } from "next/server";
import type { HealthResponse } from "@2dcite/shared";
import { storageMode } from "@/lib/storage";
import { stripeEnabled } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "ok" | "error" | "skipped" = "skipped";
  let dbError: string | undefined;
  try {
    if (process.env.DATABASE_URL) {
      const { prisma } = await import("@2dcite/db");
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } else {
      dbError = "DATABASE_URL not set";
    }
  } catch (e) {
    db = "error";
    dbError = e instanceof Error ? e.message : String(e);
  }

  const body: HealthResponse & {
    env: string;
    storage: string;
    stripe: boolean;
    db: string;
    dbError?: string;
    hasDatabaseUrl: boolean;
  } = {
    ok: db !== "error",
    service: "2dcite-api",
    version: "0.1.0",
    time: new Date().toISOString(),
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    storage: storageMode(),
    stripe: stripeEnabled(),
    db,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    ...(dbError ? { dbError: dbError.slice(0, 300) } : {}),
  };

  const status = db === "error" ? 503 : 200;
  return NextResponse.json(body, { status });
}
