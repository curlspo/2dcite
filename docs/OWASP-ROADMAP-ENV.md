# Environment variables for OWASP roadmap features

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Distributed rate limits (Upstash Redis REST) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth token |
| `MFA_ENCRYPTION_KEY` | AES key material for TOTP secrets (prefer random 32+ bytes) |
| `SESSION_SECRET` | Fallback key material if MFA key unset (still set MFA key in prod) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — stores with **private** access |
| `NEXT_PUBLIC_APP_URL` | Canonical origin for CSRF allowlist |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public; used by browser widget) |
| `TURNSTILE_SECRET_KEY` | Turnstile secret (server-only siteverify) |
| `STRIPE_*` | Existing payment keys + webhook secret |

## Local without Upstash

Rate limiting falls back to in-memory (per process). Fine for dev.

## CAPTCHA (Cloudflare Turnstile)

Public forms require a Turnstile token in production:

- Sign up (`/signup`)
- Sign in password step (`/login`)
- Forgot / reset password
- Student application (`/onboarding/student`)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile** → Add widget  
2. Hostnames: `2dcite.com`, `www.2dcite.com` (and preview hosts if needed)  
3. Copy **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`  
4. Copy **Secret Key** → `TURNSTILE_SECRET_KEY` (server only)  
5. Redeploy  

Without keys in **development**, the widget is skipped and the API allows submit.  
Without keys in **production**, verification fails closed (`CAPTCHA_FAILED`).

## Enabling Upstash on Vercel

1. Create Redis DB at [upstash.com](https://upstash.com)  
2. Copy REST URL + token  
3. `vercel env add UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`  
4. Redeploy  

## MFA

1. Sign in as admin  
2. Open `/admin/mfa`  
3. Generate secret → add to authenticator → confirm code  
4. Store backup codes offline  
5. Approve/reject/reassign require step-up on `/admin/mfa` first  
