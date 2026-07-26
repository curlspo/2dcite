# 2dcite API (v1)

Base URL (local): `http://localhost:3000/api/v1`  
Base URL (prod): `https://2dcite.com/api/v1`

All mobile and web app business operations go through this API. Auth tokens must work for both web and iOS (Bearer).

## Conventions

- JSON request/response
- Errors: `{ "error": string, "code"?: string }`
- Auth: `Authorization: Bearer <token>` (Phase 1+)
- Shared Zod schemas: `@2dcite/shared`

## Implemented (Phase 0)

### `GET /health`

No auth.

```json
{
  "ok": true,
  "service": "2dcite-api",
  "version": "0.1.0",
  "time": "2026-07-26T00:00:00.000Z"
}
```

### `GET /me`

Requires Bearer token. Phase 0 returns `401` without token, `501` with token until auth ships.

## Planned

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/register` | role: ATTORNEY \| JUDGE \| STUDENT |
| POST | `/auth/login` | returns token + user |
| POST | `/auth/logout` | invalidate session |
| PATCH | `/me` | profile |
| POST | `/student/application` | eligibility docs |
| POST | `/uploads/presign` | PDF / proof uploads |
| GET/POST | `/jobs` | client creates job |
| GET | `/jobs/:id` | detail |
| POST | `/jobs/:id/checkout` | Stripe; on success → hold + QUEUED |
| POST | `/webhooks/stripe` | payment confirmation |
| POST | `/jobs/:id/accept` | student |
| POST | `/jobs/:id/decline` | student |
| POST | `/jobs/:id/review` | findings + attestation → **cert + fund release** |
| GET | `/jobs/:id/certificate` | download metadata / signed URL |
| GET | `/admin/students` | web admin |
| POST | `/admin/students/:id/approve` | |
| POST | `/admin/students/:id/reject` | |
| GET | `/admin/payouts` | HELD \| RELEASED \| REFUNDED |

## Funds semantics

- Checkout success creates `Payment` (SUCCEEDED) and `Payout` (HELD).
- `POST /jobs/:id/review` success creates `Certificate` and sets `Payout` → RELEASED (student share transfer).
- Platform fee never leaves platform as student transfer.

## Job status

`DRAFT` → `AWAITING_PAYMENT` → `QUEUED` → `ASSIGNED` → `IN_REVIEW` → `COMPLETED` → `CERTIFIED`  
Side: `CANCELLED`, `REASSIGNING`, `FLAGGED`
