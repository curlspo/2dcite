# 2dcite

Marketplace matching **attorneys and judges** with qualified **law students** for independent human-in-the-loop **citation review**, with a formal **Certificate of Citation Review**.

- **Web:** [2dcite.com](https://2dcite.com) (this monorepo’s `apps/web`)
- **iOS:** Expo app (`apps/mobile`) → Apple App Store
- **API:** `/api/v1` — shared by web and mobile

**Critical product rules:** liability remains with the licensed attorney/judge; citation checking is non-delegable; students are an independent verification layer only. See [`docs/PRODUCT.md`](./docs/PRODUCT.md).

**Funds:** client pays on upload → platform **holds** → student share **released only when the Certificate is auto-generated**.

## Monorepo

```
apps/web          Next.js (marketing, dashboard, API)
apps/mobile       Expo (iOS first)
packages/shared   Enums, Zod schemas, disclaimers, pricing
packages/db       Prisma schema + client
packages/api-client  Typed fetch client for web + mobile
docs/             PRODUCT.md, API.md
```

## Prerequisites

- Node.js 22+ (20+ OK)
- pnpm 9+
- PostgreSQL (for Phase 1+; schema is ready)

## Setup

```bash
cd ~/2dcite
cp .env.example .env
# Edit DATABASE_URL if needed (default SQLite file under packages/db)
pnpm install
pnpm approve-builds --all   # allow prisma/esbuild native builds (pnpm 11+)
pnpm db:generate
pnpm db:push
pnpm db:seed                # admin@2dcite.com / admin-change-me-now
```

### Run web

```bash
pnpm dev:web
# http://localhost:3000
# Sign in: /login · Admin: /admin/students · Student app: /onboarding/student
```

### Run mobile

```bash
pnpm dev:mobile
# Set EXPO_PUBLIC_API_URL if not using localhost (use machine LAN IP on device)
```

### Database

Local default is **SQLite** (`packages/db/dev.db`). Switch `provider` + `DATABASE_URL` to PostgreSQL for production.

```bash
pnpm db:push
pnpm db:studio
pnpm db:seed
```

### Seeded admin (local only)

| Email | Password |
|-------|----------|
| `admin@2dcite.com` | `admin-change-me-now` |

Change before any real deployment.

## Phases

| Phase | Focus | Status |
|-------|--------|--------|
| **0** | Monorepo, shared domain, marketing shell, API health, mobile stub | Done |
| **1** | Auth, student application, admin approve, eligibility gate | Done |
| **2** | Jobs, PDF upload, Stripe/dev pay, **payment hold** | Done |
| **3** | Matching, accept/decline, student review | Done |
| **4** | Certificate PDF + **fund release** | Done |
| **5** | Launch polish, legal drafts, admin ops, checklist | Done |
| **6** | TestFlight / App Store | |

## Liability copy

Import from `@2dcite/shared` only (`disclaimers.ts`). Do not hardcode divergent legal strings in UI.

## Launch

See [`docs/LAUNCH.md`](./docs/LAUNCH.md) for the soft-launch checklist (DNS, Stripe live keys, counsel review, Postgres, domain).

## License

Proprietary — All rights reserved.
