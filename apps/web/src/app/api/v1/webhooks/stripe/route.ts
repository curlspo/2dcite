import { getStripe } from "@/lib/stripe";
import { markJobPaid } from "@/lib/payments";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Stripe webhook: checkout.session.completed → hold funds, queue job.
 * Configure STRIPE_WEBHOOK_SECRET and endpoint: /api/v1/webhooks/stripe
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return jsonError("Stripe not configured", 500);
  }

  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return jsonError("Webhook not configured", 400);
  }

  const raw = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature failed", err);
    return jsonError("Invalid signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const jobId = session.metadata?.jobId;
    if (jobId && session.payment_status === "paid") {
      await markJobPaid({
        jobId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      });
    }
  }

  return jsonOk({ received: true });
}
