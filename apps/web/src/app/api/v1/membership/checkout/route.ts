import { MEMBERSHIP } from "@2dcite/shared";
import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { stripeEnabled } from "@/lib/payments";
import {
  getMembershipForUser,
  isMembershipActive,
  membershipSummary,
} from "@/lib/membership";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimitPaidApi } from "@/lib/rate-limit";

/**
 * POST /membership/checkout
 * Starts a Stripe Checkout subscription (paid Stripe API).
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const ip = clientIp(request);
    const paidRl = await rateLimitPaidApi("stripeCheckout", {
      userId: user.id,
      ip,
    });
    if (!paidRl.ok) {
      return jsonError(
        "Too many payment attempts. Please try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: paidRl.retryAfterSec }
      );
    }
    if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
      return jsonError(
        "Only attorneys and judges can purchase membership",
        403,
        "FORBIDDEN"
      );
    }

    const existing = await getMembershipForUser(user.id);
    if (isMembershipActive(existing)) {
      return jsonError(
        "You already have an active membership",
        400,
        "ALREADY_MEMBER"
      );
    }

    if (!stripeEnabled()) {
      return jsonError(
        "Payments are not configured. Membership checkout requires Stripe.",
        503,
        "STRIPE_REQUIRED"
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return jsonError("Stripe is not configured", 503, "STRIPE_MISSING");
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Reuse Stripe customer if we already created one
    let customerId = existing?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.membership.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          status: "INCOMPLETE",
          stripeCustomerId: customerId,
        },
        update: {
          stripeCustomerId: customerId,
          status: "INCOMPLETE",
        },
      });
    }

    // Prefer a pre-created Price ID from env (recommended for production);
    // otherwise create inline recurring price_data.
    const priceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID?.trim();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: MEMBERSHIP.monthlyCents,
                recurring: { interval: "month" },
                product_data: {
                  name: MEMBERSHIP.name,
                  description: MEMBERSHIP.tagline,
                },
              },
            },
          ],
      metadata: {
        userId: user.id,
        type: "membership",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          type: "membership",
        },
      },
      success_url: `${appUrl}/membership?success=1`,
      cancel_url: `${appUrl}/membership?cancelled=1`,
      allow_promotion_codes: true,
    });

    return jsonOk({
      mode: "stripe",
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** GET /membership/checkout — current membership summary for the signed-in user */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const m = await getMembershipForUser(user.id);
    return jsonOk({
      membership: membershipSummary(m),
      product: {
        name: MEMBERSHIP.name,
        tagline: MEMBERSHIP.tagline,
        monthlyCents: MEMBERSHIP.monthlyCents,
        includedReviewsPerMonth: MEMBERSHIP.includedReviewsPerMonth,
        additionalReviewDiscountBps: MEMBERSHIP.additionalReviewDiscountBps,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
