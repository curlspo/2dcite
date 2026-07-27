# Stripe setup for 2dcite

Checkout paths:

- **Per-job payment:** `POST /api/v1/jobs/:id/checkout` (mode `payment`)
- **Membership ($99/mo):** `POST /api/v1/membership/checkout` (mode `subscription`)
- **Webhook:** `POST /api/v1/webhooks/stripe`

### Membership (optional env)

| Variable | Purpose |
|----------|---------|
| `STRIPE_MEMBERSHIP_PRICE_ID` | Pre-created Stripe Price ID for $99/mo (recommended). If unset, Checkout creates a recurring `price_data` inline. |

Webhook events to enable:

- `checkout.session.completed` (jobs + membership)
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid` (resets included review each cycle)

## Fast path (recommended)

1. Open **Test mode** in Stripe: [API keys](https://dashboard.stripe.com/test/apikeys)
2. Copy `sk_test_…` and `pk_test_…`
3. Create webhook: [Webhooks](https://dashboard.stripe.com/test/webhooks)  
   - URL: `https://2dcite.com/api/v1/webhooks/stripe`  
   - Events: see list above  
   - Copy `whsec_…`
4. From the monorepo:

```bash
cd ~/2dcite
export STRIPE_SECRET_KEY='sk_test_...'
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'
export STRIPE_WEBHOOK_SECRET='whsec_...'
bash scripts/set-stripe-env.sh
```

Or paste the three values as args:

```bash
bash scripts/set-stripe-env.sh sk_test_xxx pk_test_xxx whsec_xxx
```

5. Confirm:

```bash
curl -s https://2dcite.com/api/v1/health | python3 -m json.tool
# stripe: true
# stripeStatus.mode: "test"
# stripeStatus.hasWebhookSecret: true
```

## 1. Stripe account

1. Sign up / log in at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Complete business profile (required for **live** mode)
3. Start in **Test mode** (toggle in dashboard), then go live later

## 2. API keys

**Developers → API keys**

| Env var | Value |
|---------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (then `sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (then `pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from webhook endpoint |

## 3. Webhook

**Developers → Webhooks → Add endpoint**

| Field | Value |
|-------|--------|
| Endpoint URL | `https://2dcite.com/api/v1/webhooks/stripe` |
| Events | `checkout.session.completed` |

Without the webhook secret, Checkout can open, but jobs may not auto-mark paid after success.

## 4. Smoke test

1. Log in as attorney on production  
2. Create job → **Pay**  
3. Stripe Checkout → test card `4242 4242 4242 4242` (any future expiry, any CVC)  
4. After success → job **QUEUED** / **ASSIGNED**, payout **HELD**

## Notes

- Mock pay is **disabled** on Vercel production without `ALLOW_DEV_MOCK_PAY=true`
- Do not commit real keys to git  
- Rotate keys if they appear in chat logs  
- Invalid/truncated `sk_test` keys return `STRIPE_INVALID_KEY` from checkout  
