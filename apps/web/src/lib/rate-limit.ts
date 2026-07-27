import "server-only";
/**
 * Distributed rate limiting (OWASP roadmap).
 * - Prefer Upstash Redis REST when UPSTASH_REDIS_REST_URL + TOKEN are set
 * - Fallback: in-memory (single instance / local dev)
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true };
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

/**
 * Fixed-window counter via Upstash REST INCR + EXPIRE.
 * Key: `rl:{key}` with TTL = window seconds.
 */
async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    // Pipeline: INCR then EXPIRE if first hit (when count === 1)
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSec), "NX"],
        ["TTL", redisKey],
      ]),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[rate-limit] Upstash HTTP", res.status);
      return memoryRateLimit(key, limit, windowMs);
    }

    const data = (await res.json()) as Array<{ result: number | string }>;
    const count = Number(data[0]?.result ?? 0);
    let ttl = Number(data[2]?.result ?? windowSec);
    if (!Number.isFinite(ttl) || ttl < 0) ttl = windowSec;

    if (count > limit) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, ttl || windowSec),
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("[rate-limit] Upstash error, falling back to memory", e);
    return memoryRateLimit(key, limit, windowMs);
  }
}

/**
 * Rate limit — async so Redis can be used. Prefer this everywhere.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (upstashConfigured()) {
    return upstashRateLimit(key, limit, windowMs);
  }
  return memoryRateLimit(key, limit, windowMs);
}

/** Backend in use (for /health diagnostics). */
export function rateLimitBackend(): "upstash" | "memory" {
  return upstashConfigured() ? "upstash" : "memory";
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

/**
 * Presets for endpoints that call paid external APIs (Stripe, Blob, Resend).
 * Values: [per-user limit, per-IP limit, windowMs]
 */
export const PAID_API_LIMITS = {
  /** Stripe Checkout (job pay + membership) */
  stripeCheckout: {
    user: 15,
    ip: 30,
    windowMs: 60 * 60 * 1000,
  },
  /** Stripe API reads in webhook handler (after signature check) */
  stripeWebhook: {
    ip: 300,
    windowMs: 60 * 1000, // per minute — allow Stripe bursts
  },
  /** Vercel Blob writes (uploads) */
  blobWrite: {
    user: 40,
    ip: 80,
    windowMs: 60 * 60 * 1000,
  },
  /** Vercel Blob reads (document / certificate download) */
  blobRead: {
    user: 120,
    ip: 240,
    windowMs: 60 * 60 * 1000,
  },
  /** Resend / outbound email */
  email: {
    user: 5,
    ip: 10,
    windowMs: 60 * 60 * 1000,
  },
} as const;

export type PaidApiKind = keyof typeof PAID_API_LIMITS;

/**
 * Rate-limit an endpoint that hits a paid external API.
 * Returns null if allowed, or a RateLimitResult failure for the caller to 429.
 */
export async function rateLimitPaidApi(
  kind: PaidApiKind,
  opts: { userId?: string | null; ip: string }
): Promise<RateLimitResult> {
  const cfg = PAID_API_LIMITS[kind] as {
    user?: number;
    ip?: number;
    windowMs: number;
  };
  const windowMs = cfg.windowMs;

  if (typeof cfg.user === "number" && opts.userId) {
    const userRl = await rateLimit(
      `paid:${kind}:user:${opts.userId}`,
      cfg.user,
      windowMs
    );
    if (!userRl.ok) return userRl;
  }

  const ipLimit =
    typeof cfg.ip === "number"
      ? cfg.ip
      : typeof cfg.user === "number"
        ? cfg.user * 2
        : 60;
  return rateLimit(`paid:${kind}:ip:${opts.ip}`, ipLimit, windowMs);
}
