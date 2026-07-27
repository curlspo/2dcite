import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { markJobPaid, stripeEnabled } from "@/lib/payments";
import { serializeJob } from "@/lib/jobs";
import { resolveJobPricingForUser } from "@/lib/membership";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimitPaidApi } from "@/lib/rate-limit";

/**
 * POST /jobs/:id/checkout
 * Hits Stripe Checkout API (paid) when charging a card.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
      return jsonError("Only the client can pay for a job", 403, "FORBIDDEN");
    }

    let job = await prisma.job.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!job) return jsonError("Job not found", 404, "NOT_FOUND");
    if (job.clientId !== user.id) {
      return jsonError("Forbidden", 403, "FORBIDDEN");
    }
    if (job.status !== "AWAITING_PAYMENT") {
      return jsonError(
        `Job is ${job.status}, not awaiting payment`,
        400,
        "INVALID_STATUS"
      );
    }

    // Re-resolve membership benefits in case allotment changed since create
    const isRush = job.turnaroundTier === "RUSH";
    const { pricing } = await resolveJobPricingForUser(user.id, isRush);
    if (
      pricing.grossCents !== job.grossFeeCents ||
      pricing.mode !== job.pricingMode
    ) {
      job = await prisma.job.update({
        where: { id: job.id },
        data: {
          baseFeeCents: pricing.baseFeeCents,
          rushFeeCents: pricing.rushFeeCents,
          grossFeeCents: pricing.grossCents,
          platformFeeCents: pricing.platformFeeCents,
          studentFeeCents: pricing.studentAmountCents,
          listGrossCents: pricing.listGrossCents,
          pricingMode: pricing.mode,
          payment: job.payment
            ? {
                update: { amountCents: pricing.grossCents },
              }
            : undefined,
        },
        include: { payment: true },
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Membership-included ($0) — no card charge
    if (job.grossFeeCents === 0) {
      const paid = await markJobPaid({
        jobId: job.id,
        actorId: user.id,
        stripeCheckoutSessionId: `membership_included_${job.id}`,
      });
      return jsonOk({
        mode: "membership_included",
        message:
          "Included membership review applied. No charge. Job queued for matching.",
        job: serializeJob(paid, user),
      });
    }

    const isProd =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const allowMock =
      process.env.ALLOW_DEV_MOCK_PAY === "true" ||
      (!isProd && process.env.ALLOW_DEV_MOCK_PAY !== "false");

    if (!stripeEnabled() || body.devMock === true) {
      if (body.devMock === true && isProd && process.env.ALLOW_DEV_MOCK_PAY !== "true") {
        return jsonError("Dev mock payment disabled in production", 403);
      }
      if (stripeEnabled() && body.devMock !== true) {
        // fall through to Stripe
      } else if (!stripeEnabled() && !allowMock) {
        return jsonError(
          "Payments are not configured. Set STRIPE_SECRET_KEY for production.",
          503,
          "STRIPE_REQUIRED"
        );
      } else if (!stripeEnabled() || body.devMock === true) {
        const paid = await markJobPaid({
          jobId: job.id,
          actorId: user.id,
          stripeCheckoutSessionId: `dev_mock_${job.id}`,
        });
        return jsonOk({
          mode: "dev_mock",
          message:
            "Payment recorded (dev mock). Funds held by platform until certificate.",
          job: serializeJob(paid, user),
        });
      }
    }

    const stripe = getStripe();
    if (!stripe) {
      return jsonError(
        "Stripe is not configured. Set a valid STRIPE_SECRET_KEY (sk_test_… or sk_live_…) on the server.",
        503,
        "STRIPE_MISSING"
      );
    }

    const priceLabel =
      job.pricingMode === "MEMBERSHIP_DISCOUNT"
        ? "Member price (10% off)"
        : job.turnaroundTier === "RUSH"
          ? "Rush citation review"
          : "Standard 48h citation review";

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: job.grossFeeCents,
              product_data: {
                name: `2dcite citation review: ${job.title}`,
                description: `${priceLabel} (funds held until certificate)`,
              },
            },
          },
        ],
        metadata: {
          jobId: job.id,
          clientId: user.id,
          type: "job_payment",
          pricingMode: job.pricingMode,
        },
        success_url: `${appUrl}/jobs/${job.id}?paid=1`,
        cancel_url: `${appUrl}/jobs/${job.id}?cancelled=1`,
      });

      if (job.payment) {
        await prisma.payment.update({
          where: { id: job.payment.id },
          data: { stripeCheckoutSessionId: session.id },
        });
      }

      return jsonOk({
        mode: "stripe",
        url: session.url,
        sessionId: session.id,
      });
    } catch (stripeErr) {
      // Log server-side only — never return Stripe/provider text to the client
      console.error("[stripe] checkout.session.create failed", stripeErr);
      return jsonError(
        "Checkout failed",
        503,
        "SERVICE_UNAVAILABLE"
      );
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
