/**
 * OWASP-aligned security helpers (headers, CSRF/origin, CSP nonces).
 */

import { NextResponse } from "next/server";

export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function allowedOrigins(): string[] {
  const origins = new Set<string>();
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (app) origins.add(app);
  origins.add("https://2dcite.com");
  origins.add("https://www.2dcite.com");
  if (!isProductionRuntime()) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    const vercel = process.env.VERCEL_URL;
    if (vercel) origins.add(`https://${vercel.replace(/\/$/, "")}`);
  }
  return [...origins];
}

export function originAllowed(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return allowedOrigins().some((a) => {
      try {
        const b = new URL(a);
        return b.protocol === u.protocol && b.host === u.host;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function assertCsrfSafe(request: Request):
  | { ok: true }
  | { ok: false; reason: string } {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { ok: true };
  }

  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/v1/webhooks/")) {
    return { ok: true };
  }

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return { ok: true };
  }

  const origin = request.headers.get("origin");
  if (origin && originAllowed(origin)) {
    return { ok: true };
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (originAllowed(refOrigin)) return { ok: true };
    } catch {
      /* ignore */
    }
  }

  if (isProductionRuntime()) {
    return { ok: false, reason: "csrf_origin" };
  }
  return { ok: true };
}

/** Generate a CSP nonce (base64). */
export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // btoa available in edge + node
  return btoa(binary);
}

export function buildCspHeader(nonce: string, isApi: boolean): string {
  if (isApi) {
    return "default-src 'none'; frame-ancestors 'none'";
  }
  // Nonce + strict-dynamic for scripts; styles still need unsafe-inline for Next/Tailwind runtime.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https:`,
    "connect-src 'self' https://api.stripe.com https://*.stripe.com https://challenges.cloudflare.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://challenges.cloudflare.com",
    ...(isProductionRuntime() ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function applySecurityHeaders(
  response: NextResponse,
  opts?: { isApi?: boolean; nonce?: string }
): NextResponse {
  const h = response.headers;
  const nonce = opts?.nonce || createCspNonce();

  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", "same-site");
  h.set("X-DNS-Prefetch-Control", "off");

  if (isProductionRuntime()) {
    h.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  h.set("Content-Security-Policy", buildCspHeader(nonce, Boolean(opts?.isApi)));
  if (!opts?.isApi) {
    h.set("x-nonce", nonce);
  }
  if (opts?.isApi) {
    h.set("Cache-Control", "no-store");
  }

  return response;
}

export function safeContentDispositionFilename(name: string): string {
  const base = name
    .replace(/[\r\n\0"\\]/g, "")
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .slice(0, 120);
  return base || "document.pdf";
}

export const MAX_JSON_BODY_BYTES = 512 * 1024;

export function contentLengthOk(
  request: Request,
  max = MAX_JSON_BODY_BYTES
): boolean {
  const cl = request.headers.get("content-length");
  if (!cl) return true;
  const n = Number(cl);
  if (!Number.isFinite(n) || n < 0) return false;
  return n <= max;
}
