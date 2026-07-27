import "server-only";
import Stripe from "stripe";

/**
 * Stripe secret key is server-only (STRIPE_SECRET_KEY).
 * Never import this module from client components.
 * Publishable keys (pk_*) are safe for browsers if/when Stripe.js is used;
 * they are not required for Checkout redirect flow.
 */

let stripe: Stripe | null = null;
let stripeKeyUsed: string | null = null;

export type StripeStatus = {
  enabled: boolean;
  mode: "test" | "live" | "unknown" | "missing";
  configured: boolean;
};

/** Safe diagnostics — booleans only, never key material. */
export function getStripeStatus(): StripeStatus {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const secretKeyLooksValid =
    secret.startsWith("sk_test_") || secret.startsWith("sk_live_");

  let mode: StripeStatus["mode"] = "missing";
  if (secret.startsWith("sk_test_")) mode = "test";
  else if (secret.startsWith("sk_live_")) mode = "live";
  else if (secret) mode = "unknown";

  return {
    enabled: secretKeyLooksValid,
    mode,
    configured: secretKeyLooksValid,
  };
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    console.error(
      "[stripe] STRIPE_SECRET_KEY is set but does not look like sk_test_/sk_live_"
    );
    return null;
  }
  if (!stripe || stripeKeyUsed !== key) {
    stripe = new Stripe(key);
    stripeKeyUsed = key;
  }
  return stripe;
}
