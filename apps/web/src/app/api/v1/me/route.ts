import { NextResponse } from "next/server";

/**
 * GET /api/v1/me
 * Phase 0 stub: returns 401 until auth (Phase 1) issues bearer/session tokens
 * usable by both web and iOS.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  // Phase 1: validate token, load user
  return NextResponse.json(
    {
      error: "Not implemented",
      code: "AUTH_PENDING",
      message: "Session validation ships in Phase 1",
    },
    { status: 501 }
  );
}
