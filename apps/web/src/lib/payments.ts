import { prisma } from "@2dcite/db";
import { writeAudit } from "@/lib/audit";

/**
 * Mark a job paid: payment SUCCEEDED, create Payout HELD, job QUEUED.
 * Idempotent if already paid/queued+.
 */
export async function markJobPaid(opts: {
  jobId: string;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  actorId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
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

    if (job.payment) {
      await tx.payment.update({
        where: { id: job.payment.id },
        data: {
          status: "SUCCEEDED",
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
          grossCents: job.grossFeeCents,
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
          payoutStatus: "HELD",
          stripeCheckoutSessionId: opts.stripeCheckoutSessionId ?? null,
        },
      },
    });

    return updated;
  });
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
