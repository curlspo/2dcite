# 2dcite API (v1)

Base URL (local): `http://localhost:3000/api/v1`  
Base URL (prod): `https://2dcite.com/api/v1`

All mobile and web app business operations go through this API. Auth tokens must work for both web and iOS (Bearer).

## Conventions

- JSON request/response
- Errors: `{ "error": string, "code"?: string }`
- Auth: `Authorization: Bearer <token>` (Phase 1+)
- Shared Zod schemas: `@2dcite/shared`

## Auth

Session tokens are random secrets stored as SHA-256 hashes. Clients may send:

- `Authorization: Bearer <token>` (iOS / API clients)
- HttpOnly cookie `2dcite_session` (web)

### Implemented (Phase 0–1)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | No auth |
| POST | `/auth/register` | role: ATTORNEY \| JUDGE \| STUDENT; returns `{ token, user }` + sets cookie |
| POST | `/auth/login` | `{ token, user }` + cookie |
| POST | `/auth/logout` | invalidate session |
| GET | `/me` | current user + studentStatus / studentProfile |
| POST | `/uploads` | multipart `file` + `purpose`; returns `{ key }` (local disk Phase 1) |
| GET/POST | `/student/application` | eligibility application (STUDENT) |
| GET | `/admin/students` | admin list (`?status=PENDING`) |
| POST | `/admin/students/:id/approve` | admin |
| POST | `/admin/students/:id/reject` | body optional `{ reason }` |

### Implemented (Phase 2)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/pricing` | tiers, acks, funds-hold copy, stripeEnabled |
| GET/POST | `/jobs` | list / create (AWAITING_PAYMENT + liability acks) |
| GET | `/jobs/:id` | detail |
| POST | `/jobs/:id/checkout` | Stripe Checkout **or** dev mock when no Stripe keys → **Payment SUCCEEDED + Payout HELD + QUEUED** |
| POST | `/webhooks/stripe` | `checkout.session.completed` → same hold path |

### Implemented (Phase 3)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/jobs/:id/accept` | student ASSIGNED → IN_REVIEW, sets dueAt |
| POST | `/jobs/:id/decline` | student; requeues + re-match |
| POST | `/jobs/:id/review` | findings + attestation → **COMPLETED** |
| GET | `/jobs/:id/document` | stream PDF (client / assigned student / admin) |
| GET | `/student/assignments` | active + history |
| POST | `/matching/run` | admin: timeout reassign + drain queue |

Matching: after pay, auto-assign next **APPROVED** student with zero active jobs; **RUSH** before standard. Accept timeout requeues.

### Planned (Phase 4+)

| Method | Path | Notes |
|--------|------|--------|
| (on review) | auto certificate | COMPLETED → CERTIFIED + **payout RELEASED** |
| GET | `/jobs/:id/certificate` | download PDF cert |
| GET | `/admin/payouts` | HELD \| RELEASED \| REFUNDED |

### `GET /health`

```json
{
  "ok": true,
  "service": "2dcite-api",
  "version": "0.1.0",
  "time": "2026-07-26T00:00:00.000Z"
}
```

## Funds semantics

- Checkout success creates `Payment` (SUCCEEDED) and `Payout` (HELD).
- `POST /jobs/:id/review` success creates `Certificate` and sets `Payout` → RELEASED (student share transfer).
- Platform fee never leaves platform as student transfer.

## Job status

`DRAFT` → `AWAITING_PAYMENT` → `QUEUED` → `ASSIGNED` → `IN_REVIEW` → `COMPLETED` → `CERTIFIED`  
Side: `CANCELLED`, `REASSIGNING`, `FLAGGED`
