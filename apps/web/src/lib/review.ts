import { prisma, type Prisma } from "@2dcite/db";
import {
  DISCLAIMER_COPY_VERSION,
  STUDENT_REVIEW_ATTESTATION,
  type SubmitReviewBody,
} from "@2dcite/shared";
import { writeAudit } from "@/lib/audit";

/**
 * Student submits structured citation review.
 * Phase 3: job → COMPLETED (certificate + fund release in Phase 4).
 */
export async function submitReview(
  jobId: string,
  studentId: string,
  body: SubmitReviewBody
) {
  if (body.disclaimerCopyVersion !== DISCLAIMER_COPY_VERSION) {
    throw Object.assign(
      new Error(
        `Disclaimer version mismatch. Expected ${DISCLAIMER_COPY_VERSION}. Refresh and re-attest.`
      ),
      { status: 400 }
    );
  }
  if (!body.attestationAccepted) {
    throw Object.assign(new Error("Attestation required"), { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { review: true },
  });
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }
  if (job.studentId !== studentId) {
    throw Object.assign(new Error("Not your assignment"), { status: 403 });
  }
  if (job.status !== "IN_REVIEW") {
    throw Object.assign(
      new Error(`Job must be IN_REVIEW to submit (status: ${job.status})`),
      { status: 400 }
    );
  }
  if (job.review) {
    throw Object.assign(new Error("Review already submitted"), { status: 400 });
  }

  const now = new Date();
  const platform = body.platform === "IOS" ? "IOS" : "WEB";

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        jobId,
        findings: body.findings as unknown as Prisma.InputJsonValue,
        overallNotes: body.overallNotes ?? null,
        attestationAt: now,
        disclaimerCopyVersion: body.disclaimerCopyVersion,
        platform,
        submittedAt: now,
      },
    });

    const updated = await tx.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
      include: {
        payment: true,
        payout: true,
        certificate: true,
        review: true,
        student: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: studentId,
        action: "job.review_submitted",
        entityType: "Job",
        entityId: jobId,
        metadata: {
          findingsCount: body.findings.length,
          attestation: STUDENT_REVIEW_ATTESTATION.slice(0, 80),
        },
      },
    });

    return { job: updated, review };
  });

  return result;
}
