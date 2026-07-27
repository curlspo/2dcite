# 2dcite — OWASP alignment

Maps the OWASP Top 10 (2021) and selected ASVS L1 practices to 2dcite controls.  
Last updated: 2026-07-27.

This is an engineering baseline—not a formal certification or pentest report.

---

## A01:2021 — Broken Access Control

| Control | Implementation |
|---------|----------------|
| Role checks | `requireUser` / `requireRole` on API routes |
| Object-level auth (IDOR) | Jobs/docs/certs check `clientId`, `studentId`, or `ADMIN` |
| Uniform denials | Unauthorized object access → generic **404** (not 403) where useful |
| Blind matching | Student identity redacted from attorney/judge APIs & certs |
| Admin surface | `/api/v1/admin/*` and `/admin/*` require `ADMIN` |
| CSRF | Origin/Referer validation on cookie mutations (`middleware` + `assertCsrfSafe`) |
| Path isolation | Uploads under `users/{userId}/…`; storage keys validated |

## A02:2021 — Cryptographic Failures

| Control | Implementation |
|---------|----------------|
| TLS | HTTPS on production (Vercel); HSTS header |
| Passwords | bcrypt cost **12**; never plain text |
| Sessions | Random 32-byte tokens; **SHA-256** at rest in DB |
| Cookies | `HttpOnly`, `Secure` (prod), `SameSite=Lax`, host-only path `/` |
| Secrets | Stripe/DB keys in env only; never returned by `/health` |
| Source maps | `productionBrowserSourceMaps: false` |

## A03:2021 — Injection

| Control | Implementation |
|---------|----------------|
| SQL | Prisma parameterized queries only |
| Input validation | Zod schemas on auth, jobs, reviews, applications |
| Sanitization | Control-char / HTML-ish strip (`packages/shared/src/sanitize.ts`) |
| Headers | Content-Disposition filenames sanitized |
| Storage keys | No `..`, absolute paths, or null bytes; path resolved under upload root |
| File types | Upload allowlist + size cap (20MB) |

## A04:2021 — Insecure Design

| Control | Implementation |
|---------|----------------|
| Liability / scope | Product rules: non-delegable duty, hold funds until cert |
| Blind matching | Designed to prevent retaliation after adverse findings |
| Membership economics | Student share from list price; platform absorbs discounts |
| Rate limits | Auth, upload, review (in-memory; Redis recommended at scale) |
| Least privilege | Students one active assignment; admin gates |

## A05:2021 — Security Misconfiguration

| Control | Implementation |
|---------|----------------|
| Security headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP |
| Error handling | Generic production messages; no stacks/Zod dumps to clients |
| Health endpoint | No raw DB errors in production |
| Framework | Next.js App Router; private package; no public debug routes |
| security.txt | `/.well-known/security.txt` |

## A06:2021 — Vulnerable and Outdated Components

| Control | Implementation |
|---------|----------------|
| Lockfile | pnpm lockfile committed |
| Practice | Run `pnpm audit` in CI regularly; patch critical CVEs promptly |
| Minimal deps | Prefer platform primitives (Stripe, Prisma, bcryptjs) |

## A07:2021 — Identification and Authentication Failures

| Control | Implementation |
|---------|----------------|
| Password policy | Min 10 chars (schema) |
| Login rate limit | Per IP and per email |
| Timing | Dummy bcrypt compare when user missing |
| Generic failures | Same message for bad email/password |
| Session fixation | New session token on every successful login |
| Logout | Server-side session delete + cookie clear with secure flags |
| Failed login audit | `user.login_failed` (domain + IP only, no password) |
| MFA | **Not yet** — recommended for ADMIN accounts (roadmap) |

## A08:2021 — Software and Data Integrity Failures

| Control | Implementation |
|---------|----------------|
| Webhooks | Stripe signature verification required |
| CI/deploy | Vercel from controlled deploys; no untrusted client code execution |
| Integrity of reviews | Reviews attested + disclaimer copy version checked |

## A09:2021 — Security Logging and Monitoring Failures

| Control | Implementation |
|---------|----------------|
| Audit log | `AuditLog` for register, login, logout, jobs, payments, admin |
| Server logs | Full errors server-side only (`logServerError`) |
| No secrets in logs | Stripe status helpers never print keys |
| Gap | Central SIEM / alerting not wired yet |

## A10:2021 — Server-Side Request Forgery (SSRF)

| Control | Implementation |
|---------|----------------|
| Outbound fetch | Limited to Vercel Blob URLs resolved by pathname prefix |
| No user-controlled URL fetch | Uploads are push (multipart), not fetch-from-URL |
| Storage keys | Allowlist prefixes only |

---

## Request flow (cookie clients)

```
Browser → middleware (headers, CSRF Origin, size gate)
       → API route (authz + Zod + business logic)
       → jsonError (generic body in production)
```

Bearer (mobile) skips CSRF Origin check; still requires valid session token.

---

## Roadmap status (implemented 2026-07-27)

| Item | Status | Notes |
|------|--------|-------|
| Distributed rate limits | Done | Upstash REST when env set; memory fallback |
| Admin TOTP MFA + step-up | Done | `/admin/mfa`, step-up on approve/reject/reassign |
| Private blob storage | Done | `access: "private"` + server `get()` |
| CSP nonces | Done | Middleware nonce + `strict-dynamic` |
| CI SAST / audit | Done | `.github/workflows/security.yml` |
| Formal pen test | Process | See `docs/PENTEST-CHECKLIST.md` |

Env guide: `docs/OWASP-ROADMAP-ENV.md`

---

## Related docs

- `docs/SECURITY-AUDIT.md` — endpoint matrix  
- `docs/STRIPE-SETUP.md` — payment webhooks  
- Privacy Policy — data protection / retention  
