# 2dcite.com — Soft launch checklist

## Product readiness (Phases 0–6)

- [x] Auth (web + token for mobile)
- [x] Student eligibility + admin approve
- [x] Jobs, PDF upload, liability acks
- [x] Payment hold (Stripe or dev mock)
- [x] Matching, accept/decline, review
- [x] Certificate PDF + fund release
- [x] Admin overview, reassign, payouts, audit (Phase 5)
- [x] iOS Expo app (client + student flows) — see [IOS.md](./IOS.md)
- [ ] App Store Connect listing + TestFlight (EAS submit)

## Before public traffic

### Legal / compliance

- [ ] Counsel reviews Terms, Privacy, Disclaimer
- [ ] Confirm bar advertising / UPL positioning in your jurisdictions
- [ ] Confirm student labor / independent contractor treatment for payouts
- [ ] Set real fee amounts and platform % in `packages/shared/src/pricing.ts`
- [ ] Configure `support@2dcite.com` (or update `SUPPORT_EMAIL`)

### Payments

- [ ] Stripe live keys + webhook `https://2dcite.com/api/v1/webhooks/stripe`
- [ ] Test Checkout end-to-end in live mode with a real card
- [ ] Plan Stripe Connect (or manual ACH) for student bank payouts
- [ ] Disable or protect dev mock checkout in production (`NODE_ENV=production`)

### Infrastructure

- [ ] Production Postgres (Neon/Supabase/RDS) — switch Prisma provider if still on SQLite
- [ ] Object storage (S3/R2) for PDFs and certificates
- [ ] `AUTH_SECRET` long random value
- [ ] `NEXT_PUBLIC_APP_URL=https://2dcite.com`
- [ ] Deploy web to Vercel (or equivalent); attach custom domain **2dcite.com**
- [ ] TLS + DNS A/CNAME verified
- [ ] Seed production admin with a strong password (not the local default)

### Ops

- [ ] Admin login smoke test: students, reassign, payouts, audit
- [ ] Attorney happy path: pay → match → cert download
- [ ] Student happy path: accept → review → payout RELEASED
- [ ] iOS happy path on simulator / TestFlight (see [IOS.md](./IOS.md))
- [ ] Error monitoring (e.g. Sentry) optional
- [ ] Backup policy for DB and uploads

## Deploy

Full step-by-step: **[docs/DEPLOY.md](./DEPLOY.md)**

```bash
# CLI
npm i -g vercel && vercel login
cd ~/2dcite/apps/web
vercel link
# Set env vars in Vercel dashboard (see .env.production.example)
vercel --prod
```

Or: `pnpm deploy:prod` from monorepo root after linking.

## Post-launch (Phase 6+)

- [ ] TestFlight / App Store iOS build against production API
- [ ] Push notifications
- [ ] Stripe Connect automatic transfers
- [ ] Android (optional)
