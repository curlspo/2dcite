# Stripe setup for 2dcite

App checkout code is ready (`/api/v1/jobs/:id/checkout` + webhook).
Production currently shows `"stripe": false` until keys are set.

## 1. Stripe account

1. Sign up / log in at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Complete business profile (required for live mode)
3. Start in **Test mode** (toggle in dashboard), then go live later

## 2. API keys

**Developers → API keys**

| Env var | Value |
|---------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (then `sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (then `pk_live_...`) |

Add to Vercel (Production + Preview):

```bash
cd ~/2dcite
printf '%s' 'sk_test_xxx' | vercel env add STRIPE_SECRET_KEY production
printf '%s' 'sk_test_xxx' | vercel env add STRIPE_SECRET_KEY preview
printf '%s' 'pk_test_xxx' | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
printf '%s' 'pk_test_xxx' | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview
```

Or paste keys here in chat and ask to wire them (prefer test keys first).

## 3. Webhook

**Developers → Webhooks → Add endpoint**

| Field | Value |
|-------|--------|
| Endpoint URL | `https://2dcite.com/api/v1/webhooks/stripe` |
| (until DNS works) | `https://2dcite.vercel.app/api/v1/webhooks/stripe` |
| Events | `checkout.session.completed` |

Copy **Signing secret** (`whsec_...`) → Vercel:

```bash
printf '%s' 'whsec_xxx' | vercel env add STRIPE_WEBHOOK_SECRET production
printf '%s' 'whsec_xxx' | vercel env add STRIPE_WEBHOOK_SECRET preview
```

## 4. Redeploy

```bash
cd ~/2dcite && vercel --prod --yes
curl -s https://2dcite.vercel.app/api/v1/health | jq .stripe
# true
```

## 5. Smoke test

1. Log in as attorney on production  
2. Create job → pay  
3. Should redirect to Stripe Checkout (test card `4242 4242 4242 4242`)  
4. After success, job becomes **QUEUED** / **ASSIGNED**, payout **HELD**

## Notes

- Mock pay is **disabled** on Vercel production without `ALLOW_DEV_MOCK_PAY=true`
- Do not commit real keys to git  
- Rotate keys if they appear in chat logs  
