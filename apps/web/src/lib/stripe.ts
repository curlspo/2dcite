import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    // apiVersion pinned by installed stripe package defaults when omitted
    stripe = new Stripe(key);
  }
  return stripe;
}
