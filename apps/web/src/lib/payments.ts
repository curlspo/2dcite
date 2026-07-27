import "server-only";
import { prisma, enterBypassRls, applyRlsConfig } from "@2dcite/db";
import { writeAudit } from "@/lib/audit";
import { consumeIncludedReview } from "@/lib/membership";

/**
 * Mark a job paid: payment SUCCEEDED, create Payout HELD, job QUEUED.
 * Runs under RLS bypass after Stripe/auth has already authorized the payment.
 */
export async function markJobPaid(opts: {
  jobId: string;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  actorId?: string | null;
}) {
  return enterBypassRls(() => markJobPaidInner(opts));
}

async function markJobPaidInner(opts: {
  jobId: string;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  actorId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await applyRlsConfig(tx, { mode: "bypass", reason: "markJobPaid" });
    const job = await tx.job.findUnique({
      where: { id: opts.jobId },
      include: { payment: true, payout: true },
    });
    if (!job) {
      throw Object.assign(new Error("Job not found"), { status: 404 });
    }

    // Already past payment
    if (
      job.status === "QUEUED" ||
      job.status === "ASSIGNED" ||
      job.status === "IN_REVIEW" ||
      job.status === "COMPLETED" ||
      job.status === "CERTIFIED"
    ) {
      return job;
    }

    if (job.status !== "AWAITING_PAYMENT" && job.status !== "DRAFT") {
      throw Object.assign(
        new Error(`Cannot pay job in status ${job.status}`),
        { status: 400 }
      );
    }

    const paidAt = new Date();
    // Payout gross uses list economics so student share is funded correctly
    const payoutGross =
      job.listGrossCents != null && job.listGrossCents > 0
        ? job.listGrossCents
        : job.grossFeeCents > 0
          ? job.grossFeeCents
          : job.studentFeeCents + Math.max(0, job.platformFeeCents);

    if (job.payment) {
      await tx.payment.update({
        where: { id: job.payment.id },
        data: {
          status: "SUCCEEDED",
          amountCents: job.grossFeeCents,
          paidAt,
          stripePaymentIntentId:
            opts.stripePaymentIntentId ?? job.payment.stripePaymentIntentId,
          stripeCheckoutSessionId:
            opts.stripeCheckoutSessionId ??
            job.payment.stripeCheckoutSessionId,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          jobId: job.id,
          amountCents: job.grossFeeCents,
          status: "SUCCEEDED",
          paidAt,
          stripePaymentIntentId: opts.stripePaymentIntentId ?? null,
          stripeCheckoutSessionId: opts.stripeCheckoutSessionId ?? null,
        },
      });
    }

    if (!job.payout) {
      await tx.payout.create({
        data: {
          jobId: job.id,
          studentId: null,
          // Student share always list-based; platform may subsidize
          grossCents: Math.max(payoutGross, job.studentFeeCents),
          platformFeeCents: job.platformFeeCents,
          studentAmountCents: job.studentFeeCents,
          status: "HELD",
          heldAt: paidAt,
        },
      });
    }

    const updated = await tx.job.update({
      where: { id: job.id },
      data: { status: "QUEUED" },
      include: {
        payment: true,
        payout: true,
        certificate: true,
        student: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: opts.actorId ?? job.clientId,
        action: "job.payment_held",
        entityType: "Job",
        entityId: job.id,
        metadata: {
          amountCents: job.grossFeeCents,
          listGrossCents: job.listGrossCents,
          pricingMode: job.pricingMode,
          payoutStatus: "HELD",
          stripeCheckoutSessionId: opts.stripeCheckoutSessionId ?? null,
        },
      },
    });

    return updated;
  }).then(async (job) => {
    // Consume included membership allotment after successful pay
    if (job.pricingMode === "MEMBERSHIP_INCLUDED") {
      try {
        await consumeIncludedReview(job.clientId);
      } catch (e) {
        console.error("Failed to consume membership included review", e);
      }
    }

    // Auto-match after funds held (outside payment transaction)
    try {
      const { assignJobIfPossible } = await import("@/lib/matching");
      const assigned = await assignJobIfPossible(job.id);
      return assigned ?? job;
    } catch (e) {
      console.error("Matching after pay failed", e);
      return job;
    }
  });
}

export function stripeEnabled(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() || "";
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}
