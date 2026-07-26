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
pnpm install
pnpm db:generate
```

### Run web

```bash
pnpm dev:web
# http://localhost:3000
# http://localhost:3000/api/v1/health
```

### Run mobile

```bash
pnpm dev:mobile
# Expo Dev Tools — open on iOS simulator / device
```

### Database (when Postgres is available)

```bash
# set DATABASE_URL in .env
pnpm db:push
pnpm db:studio
```

## Phases

| Phase | Focus |
|-------|--------|
| **0** | Monorepo, shared domain, marketing shell, API health, mobile stub |
| **1** | Auth, student application, admin approve |
| **2** | Jobs, PDF upload, Stripe, **payment hold** |
| **3** | Matching, student review |
| **4** | Certificate PDF + **fund release** |
| **5** | 2dcite.com launch polish |
| **6** | TestFlight / App Store |

## Liability copy

Import from `@2dcite/shared` only (`disclaimers.ts`). Do not hardcode divergent legal strings in UI.

## License

Proprietary — All rights reserved.
