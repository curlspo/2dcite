# 2dcite endpoint security audit

Date: 2026-07-27  
Scope: `apps/web` API routes (`/api/v1/*`), auth, file upload, payments webhook.

## Summary

| Severity | Count | Notes |
|----------|------:|-------|
| Critical | 0 open | Blind-matching student identity leak **fixed** this cycle |
| High | 1 residual | In-memory rate limits are best-effort on serverless |
| Medium | few | Health surface, webhook secret dependency |
| Low | ops | Prefer Redis rate limits; Stripe Customer Portal for cancel |

## Password storage

- **Status: OK** — `bcrypt` with 12 rounds (`apps/web/src/lib/password.ts`). Plain-text passwords are never stored or logged.
- Login uses constant-ish failure message (`Invalid email or password`).

## Input sanitization

- Shared helpers: `packages/shared/src/sanitize.ts`
- Applied via Zod transforms on register, login, student application, job create, review submit
- Upload: purpose allowlist, filename sanitize, size/type limits, rate limits

## Blind matching (retaliation protection)

| Surface | Before | After |
|---------|--------|-------|
| `serializeJob` for attorney/judge | Exposed `student.id` + `name` | Redacted; `studentAssigned` only |
| Job detail UI | “Student: {name}” | “Identity withheld under blind matching” |
| Certificate PDF | Named student + school | Anonymized reviewer description; retention note |
| DB / admin | Full identity | Retained for court/bar production |

## Endpoint matrix

| Endpoint | Auth | Validation | Rate limit | Notes |
|----------|------|------------|------------|-------|
| `POST /auth/register` | Public | Zod + edu/bar rules | IP + email | Password hashed |
| `POST /auth/login` | Public | Zod | IP + email | Generic errors |
| `POST /auth/logout` | Session | — | — | Clears cookie |
| `GET /me` | Session | — | — | No secrets |
| `GET /health` | Public | — | — | Prod: no raw DB errors |
| `GET /pricing` | Public | — | — | Safe product data |
| `POST /uploads` | Session | Type/size/purpose | User + IP | Path under `users/{id}/` |
| `GET/POST /jobs` | Session + role | Zod + acks | — | AuthZ by role |
| `GET /jobs/:id` | Session + owner | — | — | Blind serialize |
| `POST /jobs/:id/checkout` | Client | Status checks | — | Stripe / $0 membership |
| `POST /jobs/:id/accept\|decline\|review` | Student | Zod on review | Review: yes | AuthZ assignment |
| `GET /jobs/:id/document\|certificate` | Session + owner | — | — | Check auth on download |
| `POST /membership/checkout` | Client | — | — | Stripe subscription |
| `POST /webhooks/stripe` | Stripe sig | Signature required | — | **Must keep whsec set** |
| `POST /matching/run` | Admin | — | — | Admin only |
| ` /admin/*` | Admin | — | — | Role gate |

## OWASP

See **`docs/OWASP.md`** for Top 10 control mapping (headers, CSRF, bcrypt, IDOR, CSP, audit logging, etc.).

## Error responses (2026-07-27)

- `jsonError` / `handleRouteError` always return **generic** client bodies in production (no Zod issues, no Prisma/Stripe text, no stack traces).
- Full errors are logged server-side only via `logServerError` / `console.error`.
- Next.js `error.tsx` / `global-error.tsx` show only a generic UI; never `error.message` or stack.
- `productionBrowserSourceMaps: false`.
- Browser client rejects messages that look like stacks or multi-line dumps.

## Residual risks / recommendations

1. **Rate limiting** — In-memory Map resets per serverless instance. Move to Upstash Redis / Vercel KV for production-grade DDoS resistance.
2. **Webhook** — Ensure Dashboard enables: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`.
3. **Document download** — Periodically re-verify that PDF routes check `clientId` / `studentId` / admin and never list keys across users.
4. **CSRF** — Cookie sessions + same-site; keep `SameSite` strict/lax as configured; prefer cookie + same-origin for browser mutations.
5. **Admin MFA** — Not yet; add for production ops accounts.
6. **Dependency scanning** — Run `pnpm audit` in CI regularly.
7. **Log redaction** — Never log passwords, full card data, or raw Stripe secret keys (already avoided in status helpers).

## Copyright / license posture

Product code and build are protected by U.S. copyright; no open-source license is granted to end users (see Terms §11 and Privacy §15). Hosted access is a limited end-user right only.
