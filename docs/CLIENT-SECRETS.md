# No API keys in the browser

## Rule

**Secret keys never leave the server.** Browser code only talks to same-origin `/api/v1/*` with cookies.

## What may appear in the browser

| Item | Allowed? | Notes |
|------|----------|--------|
| Session cookie (`HttpOnly`) | Yes | Not readable by JS |
| Relative `/api/v1` paths | Yes | No host key required |
| `NEXT_PUBLIC_APP_URL` | Yes | Public site URL only |
| `NEXT_PUBLIC_API_URL` | Optional | Unused in browser (relative paths) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_*`) | Optional | Safe by Stripe design; **not required** for Checkout redirect |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | Cloudflare Turnstile public site key |
| `TURNSTILE_SECRET_KEY` | **Never** | Server-only siteverify |
| `STRIPE_SECRET_KEY` (`sk_*`) | **Never** | Server only |
| `STRIPE_WEBHOOK_SECRET` (`whsec_*`) | **Never** | Server only |
| `DATABASE_URL` | **Never** | Server only |
| `BLOB_READ_WRITE_TOKEN` | **Never** | Server only |
| `RESEND_API_KEY` | **Never** | Server only |
| `MFA_ENCRYPTION_KEY` / `SESSION_SECRET` | **Never** | Server only |
| `UPSTASH_REDIS_REST_*` | **Never** | Server only |

## Controls

1. **`import "server-only"`** on modules that touch secrets (`stripe`, `payments`, `email`, `storage`, `password`, `totp`, `rate-limit`, `session`, …). Client import fails the build.
2. **Client components** only use `@/lib/api-browser` + `@2dcite/shared` (no secret env).
3. **`productionBrowserSourceMaps: false`**
4. **Health endpoint** returns booleans only — no key presence details in production.
5. **CI scan**: `pnpm check:client-secrets` greps client bundles for `sk_`, `whsec_`, etc.

## Checkout flow (no Stripe.js key in browser)

Payments use **Stripe Checkout redirect**: the browser only receives a hosted Checkout **URL** from our API. The secret key stays on the server when creating the session.

## Verify locally

```bash
pnpm --filter @2dcite/web build
pnpm check:client-secrets
```
