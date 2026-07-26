import { NextResponse } from "next/server";
import type { HealthResponse } from "@2dcite/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const body: HealthResponse = {
    ok: true,
    service: "2dcite-api",
    version: "0.1.0",
    time: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
