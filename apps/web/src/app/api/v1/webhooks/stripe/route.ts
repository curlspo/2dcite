import type Stripe from "stripe";
import { enterBypassRls } from "@2dcite/db";
import { getStripe } from "@/lib/stripe";
import { markJobPaid } from "@/lib/payments";
import {
  stripeSubStatusToMembership,
  upsertMembershipFromStripe,
} from "@/lib/membership";
import { jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimitPaidApi } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Stripe webhook — signature required; rate-limited per IP to protect Stripe API
 * follow-up calls (subscription retrieve) from abuse.
 */
export async function POST(request: Request) {
  const paidRl = await rateLimitPaidApi("stripeWebhook", {
    ip: clientIp(request),
  });
  if (!paidRl.ok) {
    return jsonError(
      "Too many requests",
      429,
      "RATE_LIMITED",
      { retryAfterSec: paidRl.retryAfterSec }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error("[stripe webhook] Stripe not configured");
    return jsonError("unavailable", 503, "SERVICE_UNAVAILABLE");
  }

  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    console.error("[stripe webhook] missing signature or secret");
    return jsonError("bad request", 400, "BAD_REQUEST");
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature failed", err);
    return jsonError("bad request", 400, "BAD_REQUEST");
  }

  try {
    await enterBypassRls(async () => {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(stripe, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(stripe, invoice);
        break;
      }
      default:
        break;
    }
    });
  } catch (err) {
    console.error("[stripe webhook] handler error", event.type, err);
    return jsonError("internal", 500, "INTERNAL");
  }

  return jsonOk({ received: true });
}

/** Stripe API 2025+ moved period dates onto subscription items. */
function periodFromSubscription(sub: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = sub.items?.data?.[0] as
    | { current_period_start?: number; current_period_end?: number }
    | undefined;
  const start = item?.current_period_start;
  const end = item?.current_period_end;
  return {
    start: typeof start === "number" ? new Date(start * 1000) : null,
    end: typeof end === "number" ? new Date(end * 1000) : null,
  };
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as
    | {
        type?: string;
        subscription_details?: { subscription?: string | { id?: string } };
      }
    | null
    | undefined;
  if (parent?.type === "subscription_details" && parent.subscription_details) {
    const s = parent.subscription_details.subscription;
    if (typeof s === "string") return s;
    if (s && typeof s === "object" && s.id) return s.id;
  }
  // Fallback for older invoice shapes
  const legacy = invoice as unknown as { subscription?: string | { id?: string } };
  if (typeof legacy.subscription === "string") return legacy.subscription;
  if (legacy.subscription && typeof legacy.subscription === "object") {
    return legacy.subscription.id ?? null;
  }
  return null;
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const type = session.metadata?.type;

  if (session.mode === "subscription" || type === "membership") {
    const userId =
      session.metadata?.userId || session.client_reference_id || null;
    if (!userId) {
      console.error("[stripe] membership checkout missing userId", session.id);
      return;
    }

    let sub: Stripe.Subscription | null = null;
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (subId) {
      sub = await stripe.subscriptions.retrieve(subId);
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    const period = sub ? periodFromSubscription(sub) : { start: new Date(), end: null };

    await upsertMembershipFromStripe({
      userId,
      status: sub
        ? stripeSubStatusToMembership(sub.status)
        : session.payment_status === "paid"
          ? "ACTIVE"
          : "INCOMPLETE",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subId ?? null,
      currentPeriodStart: period.start ?? new Date(),
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      resetIncludedUsage: true,
    });
    return;
  }

  // One-time job payment
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

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.warn("[stripe] subscription missing userId metadata", sub.id);
    return;
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const period = periodFromSubscription(sub);

  await upsertMembershipFromStripe({
    userId,
    status: stripeSubStatusToMembership(sub.status),
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

async function handleInvoicePaid(stripe: Stripe, invoice: Stripe.Invoice) {
  // Reset included reviews at the start of each paid subscription cycle
  if (invoice.billing_reason === "subscription_create") {
    return;
  }
  if (
    invoice.billing_reason !== "subscription_cycle" &&
    invoice.billing_reason !== "subscription_update"
  ) {
    return;
  }

  const subId = subscriptionIdFromInvoice(invoice);
  if (!subId) return;

  const sub = await stripe.subscriptions.retrieve(subId);
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const period = periodFromSubscription(sub);

  await upsertMembershipFromStripe({
    userId,
    status: stripeSubStatusToMembership(sub.status),
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    stripeSubscriptionId: sub.id,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    resetIncludedUsage: true,
  });
}
