import { NextResponse, type NextRequest } from "next/server";
import {
  applySecurityHeaders,
  assertCsrfSafe,
  contentLengthOk,
  createCspNonce,
  MAX_JSON_BODY_BYTES,
} from "@/lib/security";

/**
 * Edge middleware — OWASP roadmap:
 * - CSP nonces for scripts
 * - Security headers
 * - CSRF Origin checks
 * - JSON body size gate
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const nonce = createCspNonce();

  if (
    isApi &&
    !pathname.startsWith("/api/v1/uploads") &&
    !pathname.startsWith("/api/v1/webhooks/") &&
    ["POST", "PUT", "PATCH"].includes(request.method) &&
    !contentLengthOk(request, MAX_JSON_BODY_BYTES)
  ) {
    const res = NextResponse.json(
      { error: "Unable to complete this request.", code: "BAD_REQUEST" },
      { status: 413 }
    );
    return applySecurityHeaders(res, { isApi: true, nonce });
  }

  if (isApi && pathname.startsWith("/api/v1/")) {
    const csrf = assertCsrfSafe(request);
    if (!csrf.ok) {
      const res = NextResponse.json(
        { error: "Unable to complete this request.", code: "FORBIDDEN" },
        { status: 403 }
      );
      return applySecurityHeaders(res, { isApi: true, nonce });
    }
  }

  // Pass nonce to the App Router so Next can attach it to scripts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return applySecurityHeaders(response, { isApi, nonce });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
