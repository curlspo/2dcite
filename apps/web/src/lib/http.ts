import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  error: string,
  status = 400,
  code?: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error, code, ...extra },
    { status }
  );
}

export function handleRouteError(err: unknown) {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    const message =
      err instanceof Error ? err.message : "Request failed";
    if (status === 401) return jsonError(message || "Unauthorized", 401, "AUTH_REQUIRED");
    if (status === 403) return jsonError(message || "Forbidden", 403, "FORBIDDEN");
  }
  if (err instanceof ZodError) {
    return jsonError("Validation failed", 400, "VALIDATION_ERROR", {
      issues: err.flatten(),
    });
  }
  console.error(err);
  return jsonError("Internal server error", 500, "INTERNAL");
}
