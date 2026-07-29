import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Production and Vercel production deployments — never leak internals. */
export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** Safe, non-revealing client-facing messages by status. */
export function genericErrorMessage(status: number): string {
  if (status === 401) return "Unable to sign in or session expired.";
  if (status === 403) return "You do not have access.";
  if (status === 404) return "Not found.";
  if (status === 409) return "Unable to complete this request.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status === 502 || status === 503 || status === 504) {
    return "Service temporarily unavailable. Please try again later.";
  }
  if (status >= 500) return "Something went wrong. Please try again later.";
  // 400 and other client errors
  return "Unable to complete this request.";
}

function genericCode(status: number): string {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL";
  return "BAD_REQUEST";
}

/** Codes safe to expose (no system internals). Unknown codes collapse in prod. */
const SAFE_CODES = new Set([
  "UNAUTHORIZED",
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "BAD_REQUEST",
  "VALIDATION_ERROR",
  "INTERNAL",
  "SERVICE_UNAVAILABLE",
  "MFA_REQUIRED",
  "MFA_SETUP_REQUIRED",
  "STEP_UP_REQUIRED",
  "CAPTCHA_REQUIRED",
  "CAPTCHA_FAILED",
  "BAR_STATE_REQUIRED",
  "BAR_NUMBER_REQUIRED",
  "EDU_EMAIL_REQUIRED",
  "EMAIL_TAKEN",
  "LAW_SCHOOL_REQUIRED",
  "ALREADY_APPROVED",
]);

function safeCode(status: number, code?: string): string {
  if (code && SAFE_CODES.has(code)) return code;
  return genericCode(status);
}

/**
 * Log full error server-side only. Never attach stack/message to the response.
 */
export function logServerError(err: unknown, context?: string): void {
  const prefix = context ? `[api] ${context}` : "[api]";
  if (err instanceof Error) {
    console.error(prefix, err.message, err.stack);
  } else {
    console.error(prefix, err);
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/**
 * JSON error response.
 * In production the body always uses a generic message — never stacks,
 * provider text, validation field dumps, or internal codes.
 *
 * @param _developerMessage  Logged in non-production only; ignored in prod body
 * @param status HTTP status
 * @param code Optional stable code (allowlisted in prod)
 * @param extra Only `retryAfterSec` is passed through in production
 */
export function jsonError(
  _developerMessage: string,
  status = 400,
  code?: string,
  extra?: Record<string, unknown>
) {
  const prod = isProductionRuntime();
  const message = prod
    ? genericErrorMessage(status)
    : _developerMessage?.trim() || genericErrorMessage(status);

  const body: Record<string, unknown> = {
    error: message,
    code: safeCode(status, code),
  };

  if (extra && typeof extra.retryAfterSec === "number") {
    body.retryAfterSec = extra.retryAfterSec;
  }

  // Dev-only diagnostic fields (never issues/stack in production)
  if (!prod && extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (k === "retryAfterSec") continue;
      if (k === "stack" || k === "issues" || k === "detail" || k === "cause") {
        continue; // still never put stack/issues in JSON even in dev by default
      }
      body[k] = v;
    }
    if (process.env.DEBUG_API_ERRORS === "true" && extra.issues) {
      body.issues = extra.issues;
    }
  }

  return NextResponse.json(body, { status });
}

export function handleRouteError(err: unknown) {
  logServerError(err);

  // Auth / forbidden thrown with { status }
  if (err && typeof err === "object" && "status" in err) {
    const raw = Number((err as { status: number }).status);
    const status =
      Number.isFinite(raw) && raw >= 400 && raw < 600 ? raw : 500;
    const code =
      "code" in err && typeof (err as { code?: string }).code === "string"
        ? (err as { code: string }).code
        : undefined;
    if (
      code === "MFA_REQUIRED" ||
      code === "MFA_SETUP_REQUIRED" ||
      code === "STEP_UP_REQUIRED"
    ) {
      return jsonError("Additional verification required", 403, code);
    }
    if (status === 401) return jsonError("Unauthorized", 401, "AUTH_REQUIRED");
    if (status === 403) return jsonError("Forbidden", 403, "FORBIDDEN");
    if (status === 404) return jsonError("Not found", 404, "NOT_FOUND");
    if (status === 409) return jsonError("Conflict", 409, "CONFLICT");
    if (status === 429) return jsonError("Rate limited", 429, "RATE_LIMITED");
    if (status >= 500) return jsonError("Internal error", status, "INTERNAL");
    return jsonError("Bad request", status, "BAD_REQUEST");
  }

  if (err instanceof ZodError) {
    // Never return flatten()/paths to clients in production
    return jsonError("Validation failed", 400, "VALIDATION_ERROR");
  }

  // Prisma-ish errors without importing Prisma (message may leak schema)
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    String((err as { code: string }).code).startsWith("P")
  ) {
    return jsonError("Unable to complete this request", 400, "BAD_REQUEST");
  }

  // SyntaxError from bad JSON body
  if (err instanceof SyntaxError) {
    return jsonError("Unable to complete this request", 400, "BAD_REQUEST");
  }

  return jsonError("Internal server error", 500, "INTERNAL");
}
