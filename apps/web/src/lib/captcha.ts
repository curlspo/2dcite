import "server-only";

/**
 * Cloudflare Turnstile verification (server-only).
 * Site key is public (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 * Secret stays on server (TURNSTILE_SECRET_KEY).
 */

function isProd(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function captchaConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  );
}

export type CaptchaVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "not_configured" };

/**
 * Verify a Turnstile response token from a public form.
 * In production without keys configured → fail closed.
 * In development without keys → allow (local UX).
 */
export async function verifyCaptchaToken(
  token: string | null | undefined,
  remoteip?: string
): Promise<CaptchaVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    if (isProd()) {
      console.error("[captcha] TURNSTILE_SECRET_KEY not set in production");
      return { ok: false, reason: "not_configured" };
    }
    return { ok: true };
  }

  const t = typeof token === "string" ? token.trim() : "";
  if (!t) {
    return { ok: false, reason: "missing" };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", t);
    if (remoteip && remoteip !== "unknown") {
      body.set("remoteip", remoteip);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error("[captcha] siteverify HTTP", res.status);
      return { ok: false, reason: "invalid" };
    }

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return { ok: true };

    console.warn("[captcha] verification failed", data["error-codes"]);
    return { ok: false, reason: "invalid" };
  } catch (e) {
    console.error("[captcha] verify error", e);
    return { ok: false, reason: "invalid" };
  }
}

/** Extract captcha token from a JSON body object. */
export function captchaTokenFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const t = (body as { captchaToken?: unknown }).captchaToken;
  return typeof t === "string" ? t : undefined;
}
