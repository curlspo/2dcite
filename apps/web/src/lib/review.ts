import "server-only";
import { prisma, applyRlsConfig, enterUserRls, type Prisma } from "@2dcite/db";
import {
  DISCLAIMER_COPY_VERSION,
  STUDENT_REVIEW_ATTESTATION,
  type SubmitReviewBody,
} from "@2dcite/shared";
import { writeAudit } from "@/lib/audit";
import { issueCertificateAndReleaseFunds } from "@/lib/certificates";

/**
 * Student submits structured citation review.
 * Creates review → COMPLETED briefly → auto Certificate + fund release → CERTIFIED.
 */
export async function submitReview(
  jobId: string,
  studentId: string,
  body: SubmitReviewBody
) {
  return enterUserRls({ id: studentId, role: "STUDENT" }, async () => {
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

  await prisma.$transaction(async (tx) => {
    await applyRlsConfig(tx, {
      mode: "user",
      userId: studentId,
      role: "STUDENT",
    });
    await tx.review.create({
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

    await tx.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: now,
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
  });

  // Certificate + release (system path; may touch payouts/admin fields)
  const certified = await issueCertificateAndReleaseFunds(jobId);

  return {
    job: certified,
    review: await prisma.review.findUniqueOrThrow({ where: { jobId } }),
    certificate: certified.certificate,
  };
  });
}
