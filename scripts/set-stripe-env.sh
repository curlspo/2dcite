#!/usr/bin/env bash
# Wire Stripe test (or live) keys into Vercel for 2dcite.
# Usage:
#   export STRIPE_SECRET_KEY='sk_test_...'
#   export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'
#   export STRIPE_WEBHOOK_SECRET='whsec_...'   # optional for first pass
#   bash scripts/set-stripe-env.sh
#
# Or pass as args:
#   bash scripts/set-stripe-env.sh sk_test_xxx pk_test_xxx whsec_xxx
set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SK="${1:-${STRIPE_SECRET_KEY:-}}"
PK="${2:-${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}}"
WH="${3:-${STRIPE_WEBHOOK_SECRET:-}}"

if [[ -z "$SK" || -z "$PK" ]]; then
  cat <<'EOF'
Missing keys.

1) Open https://dashboard.stripe.com/test/apikeys
2) Copy Secret key (sk_test_…) and Publishable key (pk_test_…)
3) Webhook (optional now, required for auto-queue after pay):
   https://dashboard.stripe.com/test/webhooks
   Endpoint: https://2dcite.com/api/v1/webhooks/stripe
   Event: checkout.session.completed
   Copy Signing secret (whsec_…)

Then:
  export STRIPE_SECRET_KEY='sk_test_...'
  export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'
  export STRIPE_WEBHOOK_SECRET='whsec_...'   # if you have it
  bash scripts/set-stripe-env.sh
EOF
  exit 1
fi

if [[ ! "$SK" =~ ^sk_(test|live)_ ]]; then
  echo "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_"
  exit 1
fi
if [[ ! "$PK" =~ ^pk_(test|live)_ ]]; then
  echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_"
  exit 1
fi

echo "→ Removing old Stripe env vars (if any)…"
# vercel env rm is interactive; use --yes when supported
npx vercel env rm STRIPE_SECRET_KEY production --yes 2>/dev/null || true
npx vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --yes 2>/dev/null || true
npx vercel env rm STRIPE_WEBHOOK_SECRET production --yes 2>/dev/null || true

echo "→ Adding STRIPE_SECRET_KEY (production)…"
printf '%s' "$SK" | npx vercel env add STRIPE_SECRET_KEY production

echo "→ Adding NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (production)…"
printf '%s' "$PK" | npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

if [[ -n "$WH" ]]; then
  if [[ ! "$WH" =~ ^whsec_ ]]; then
    echo "Warning: STRIPE_WEBHOOK_SECRET should start with whsec_"
  fi
  echo "→ Adding STRIPE_WEBHOOK_SECRET (production)…"
  printf '%s' "$WH" | npx vercel env add STRIPE_WEBHOOK_SECRET production
else
  echo "→ Skipping STRIPE_WEBHOOK_SECRET (not provided)"
fi

echo "→ Redeploying production…"
npx vercel --prod --yes

echo
echo "→ Health check:"
curl -sS https://2dcite.com/api/v1/health | python3 -m json.tool 2>/dev/null || curl -sS https://2dcite.com/api/v1/health
echo
echo "Expect stripe: true and stripeStatus.secretKeyLooksValid: true"
echo "Smoke: log in as attorney → new job → Pay → Stripe Checkout (card 4242 4242 4242 4242)"
