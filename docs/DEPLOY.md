# Deploy 2dcite.com to production

This guide wires **Vercel** (app) + **Postgres** (Neon/Supabase) + **Vercel Blob** (files) + **Stripe** (payments) for the monorepo at `~/2dcite`.

## Architecture

```
Internet → 2dcite.com (Vercel / Next.js apps/web)
                │
                ├─ Postgres (Neon etc.) ← DATABASE_URL
                ├─ Vercel Blob          ← BLOB_READ_WRITE_TOKEN
                └─ Stripe               ← STRIPE_* keys + webhook
```

**Do not use SQLite on Vercel** — the filesystem is ephemeral. Local SQLite remains fine for dev.

---

## 1. Postgres database

### Option A — Neon (recommended)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string (pooled + `?sslmode=require`)
3. Keep it as `DATABASE_URL`

### Option B — Local Docker (parity testing)

```bash
cd ~/2dcite
docker compose up -d
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/twodcite?schema=public
```

### Switch Prisma provider to PostgreSQL

Edit `packages/db/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then:

```bash
# set DATABASE_URL in packages/db/.env and apps/web/.env.local
pnpm db:generate
pnpm db:push
pnpm db:seed   # creates admin@2dcite.com — change password immediately
```

> Your existing local SQLite `dev.db` will not carry over. Re-seed after switching.

---

## 2. Vercel project

### Install CLI (once)

```bash
npm i -g vercel
vercel login
```

### Link and deploy from monorepo

**Recommended settings in Vercel Dashboard** (after first import):

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Install Command** | `cd ../.. && corepack enable && pnpm install` |
| **Build Command** | `cd ../.. && pnpm --filter @2dcite/db exec prisma generate && pnpm --filter @2dcite/web build` |
| **Output** | Next.js default (auto) |
| **Node** | 20.x or 22.x |

Or from CLI:

```bash
cd ~/2dcite/apps/web
vercel link          # create/link project
vercel env pull      # optional
vercel --prod
```

`apps/web/vercel.json` already sets install/build commands for monorepo packages.

### GitHub (recommended for continuous deploy)

1. Create a GitHub repo and push `~/2dcite`
2. Vercel → **Add New Project** → import repo
3. Apply Root Directory / build settings above
4. Every push to `main` deploys production

```bash
cd ~/2dcite
gh repo create 2dcite --private --source=. --remote=origin --push
# or: git remote add origin git@github.com:YOU/2dcite.git && git push -u origin main
```

---

## 3. Environment variables (Vercel)

Copy from `.env.production.example`. In Vercel → Project → **Settings → Environment Variables**, set for **Production** (and Preview if desired):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon Postgres URL |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://2dcite.com` |
| `NEXT_PUBLIC_API_URL` | `https://2dcite.com/api/v1` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | from Stripe webhook endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public) |
| `TURNSTILE_SECRET_KEY` | Turnstile secret (server only) |

Generate secret:

```bash
openssl rand -hex 32
```

Validate locally (with env exported or in shell):

```bash
export $(grep -v '^#' .env.production.local | xargs)  # if you create one
node scripts/check-production-env.mjs --strict
```

---

## 4. Vercel Blob (file storage)

1. Vercel Dashboard → Storage → **Create Database** → **Blob**
2. Connect to the 2dcite project
3. `BLOB_READ_WRITE_TOKEN` is injected (or copy manually)

Without Blob on Vercel, uploads write to ephemeral disk and **will be lost**.

---

## 5. Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint  
   `https://2dcite.com/api/v1/webhooks/stripe`
2. Event: `checkout.session.completed`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

Test mode first with `sk_test_` / `pk_test_` on a Preview deployment, then live keys on Production.

---

## 6. Custom domain 2dcite.com

1. Vercel → Project → **Settings → Domains** → add `2dcite.com` and `www.2dcite.com`
2. At your DNS host (where you registered 2dcite.com):

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` (Vercel — confirm in UI) |
| CNAME | `www` | `cname.vercel-dns.com` (confirm in UI) |

3. Wait for TLS certificate (usually minutes)
4. Set `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_API_URL` to `https://2dcite.com` and redeploy

---

## 7. Post-deploy smoke test

```bash
curl -s https://2dcite.com/api/v1/health | jq
# expect ok, db: ok, storage: blob, stripe: true
```

Browser:

1. Open https://2dcite.com  
2. Sign up attorney → create job → Stripe Checkout  
3. Admin approve student → matching → review → certificate download  
4. Confirm payout **RELEASED** in `/admin/payouts`

Change the seed admin password immediately after first login.

---

## 8. Production safety

- Mock pay is **off** when `VERCEL_ENV=production` unless `ALLOW_DEV_MOCK_PAY=true`
- Health endpoint returns **503** if DB is unreachable
- Legal pages are drafts — counsel review before marketing

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `DATABASE_URL` is set at build time (can be the real Neon URL) |
| `Module not found @2dcite/shared` | Install from monorepo root; check Root Directory + installCommand |
| Uploads 500 / missing files | Set `BLOB_READ_WRITE_TOKEN` |
| Checkout 503 | Set Stripe keys or temporarily `ALLOW_DEV_MOCK_PAY=true` (not for real money) |
| DB errors with SQLite path | Switch schema provider to `postgresql` and use Neon URL |

---

## Quick command cheat sheet

```bash
# Login & deploy
npm i -g vercel
cd ~/2dcite/apps/web
vercel login
vercel link
vercel env add DATABASE_URL production
# ... add other env vars interactively or via dashboard
vercel --prod

# After domain attaches
curl https://2dcite.com/api/v1/health
```
