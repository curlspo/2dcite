import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { markJobPaid, stripeEnabled } from "@/lib/payments";
import { serializeJob } from "@/lib/jobs";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

/**
 * POST /jobs/:id/checkout
 * - With STRIPE_SECRET_KEY: create Checkout Session, return { url }
 * - Without (local dev): immediately mark paid → funds HELD, job QUEUED
 *   (set body { "devMock": true } or omit when stripe disabled)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
      return jsonError("Only the client can pay for a job", 403, "FORBIDDEN");
    }

    const job = await prisma.job.findUnique({
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

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Dev mock payment when Stripe not configured
    if (!stripeEnabled() || body.devMock === true) {
      if (stripeEnabled() && body.devMock === true && process.env.NODE_ENV === "production") {
        return jsonError("Dev mock payment disabled in production", 403);
      }
      if (stripeEnabled() && body.devMock !== true) {
        // fall through to Stripe
      } else {
        const paid = await markJobPaid({
          jobId: job.id,
          actorId: user.id,
          stripeCheckoutSessionId: `dev_mock_${job.id}`,
        });
        return jsonOk({
          mode: "dev_mock",
          message:
            "Payment recorded (dev mock). Funds held by platform until certificate.",
          job: serializeJob(paid),
        });
      }
    }

    const stripe = getStripe();
    if (!stripe) {
      return jsonError("Stripe not configured", 500, "STRIPE_MISSING");
    }

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
              description:
                job.turnaroundTier === "RUSH"
                  ? "Rush citation review (funds held until certificate)"
                  : "Standard 48h citation review (funds held until certificate)",
            },
          },
        },
      ],
      metadata: { jobId: job.id, clientId: user.id },
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
  } catch (err) {
    return handleRouteError(err);
  }
}
