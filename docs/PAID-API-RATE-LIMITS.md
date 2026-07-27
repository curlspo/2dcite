# Rate limits on paid external APIs

Every endpoint that calls a **paid third-party API** is rate-limited (per user and/or IP).

Backend: Upstash Redis when configured, otherwise in-memory (`rateLimitPaidApi` in `apps/web/src/lib/rate-limit.ts`).

## Map

| Paid service | Endpoint(s) | Limits (default) |
|--------------|-------------|------------------|
| **Stripe Checkout** | `POST /jobs/:id/checkout`, `POST /membership/checkout` | 15/user/hr, 30/IP/hr |
| **Stripe Webhooks** (+ follow-up API) | `POST /webhooks/stripe` | 300/IP/min |
| **Vercel Blob write** | `POST /uploads`, `POST /jobs/:id/review` (cert PDF) | 40/user/hr, 80/IP/hr |
| **Vercel Blob read** | `GET /jobs/:id/document`, `GET /jobs/:id/certificate?download=1` | 120/user/hr, 240/IP/hr |
| **Resend email** | `POST /auth/forgot-password` | 5/email/hr + 10/IP/hr |

## Not rate-limited as “paid API”

- Postgres (Neon) — covered by app auth + general abuse controls elsewhere  
- Public `GET /pricing`, `GET /health` — no paid vendor call  

## Response

HTTP **429** with generic body and optional `retryAfterSec`.

## Ops

Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for distributed limits across Vercel instances.
