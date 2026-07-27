import "server-only";
import { prisma } from "@2dcite/db";
import { assignJobIfPossible, reassignTimedOutAssignments } from "@/lib/matching";
import { writeAudit } from "@/lib/audit";

/**
 * Force-return a stuck ASSIGNED/IN_REVIEW job to the queue and try re-match.
 * Admin only. Does not refund payment.
 */
export async function adminReassignJob(
  jobId: string,
  adminId: string,
  reason?: string
) {
  await reassignTimedOutAssignments();

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }

  if (
    !["QUEUED", "ASSIGNED", "IN_REVIEW", "REASSIGNING"].includes(job.status)
  ) {
    throw Object.assign(
      new Error(
        `Cannot reassign job in status ${job.status}. Only QUEUED/ASSIGNED/IN_REVIEW.`
      ),
      { status: 400 }
    );
  }

  if (job.status === "IN_REVIEW") {
    // Admin override: pull back from review without cert
  }

  const previousStudentId = job.studentId;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "QUEUED",
      studentId: null,
      assignedAt: null,
      acceptedAt: null,
      dueAt: null,
    },
  });

  await writeAudit({
    actorId: adminId,
    action: "admin.job_reassign",
    entityType: "Job",
    entityId: jobId,
    metadata: {
      previousStudentId,
      previousStatus: job.status,
      reason: reason || null,
    },
  });

  const exclude = previousStudentId ? [previousStudentId] : [];
  const reassigned = await assignJobIfPossible(jobId, exclude);

  return {
    jobId,
    previousStudentId,
    newStudentId: reassigned?.studentId ?? null,
    status: reassigned?.status ?? "QUEUED",
  };
}
