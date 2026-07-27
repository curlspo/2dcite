import "server-only";
import { prisma, enterBypassRls, enterUserRls } from "@2dcite/db";
import {
  findNextAvailableStudent,
  findNextQueuedJob,
  assignmentDeadline,
  reviewDueAt,
} from "@2dcite/db";
import { writeAudit } from "@/lib/audit";

/**
 * Assign a single QUEUED job to an available approved student.
 * Returns assigned job or null if no job/student available.
 * System path: RLS bypass (cross-tenant matching).
 */
export async function assignJobIfPossible(
  jobId?: string,
  excludeUserIds: string[] = []
) {
  return enterBypassRls(async () => assignJobIfPossibleInner(jobId, excludeUserIds));
}

async function assignJobIfPossibleInner(
  jobId?: string,
  excludeUserIds: string[] = []
) {
  // Expire stale assignments first
  await reassignTimedOutAssignmentsInner();

  const job = jobId
    ? await prisma.job.findUnique({ where: { id: jobId } })
    : await findNextQueuedJob(prisma);

  if (!job || job.status !== "QUEUED") return null;

  const student = await findNextAvailableStudent(prisma, excludeUserIds);
  if (!student) return null;

  const now = new Date();
  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      studentId: student.id,
      status: "ASSIGNED",
      assignedAt: now,
      // accept window implicit from assignedAt + config
    },
    include: {
      payment: true,
      payout: true,
      certificate: true,
      student: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await writeAudit({
    actorId: null,
    action: "job.assigned",
    entityType: "Job",
    entityId: job.id,
    metadata: {
      studentId: student.id,
      acceptDeadline: assignmentDeadline(now).toISOString(),
    },
  });

  return updated;
}

/** Drain queue: assign as many QUEUED jobs as free students. */
export async function processMatchingQueue(limit = 20) {
  const results: string[] = [];
  for (let i = 0; i < limit; i++) {
    const assigned = await assignJobIfPossible();
    if (!assigned) break;
    results.push(assigned.id);
  }
  return results;
}

/**
 * ASSIGNED jobs past accept window → clear student, back to QUEUED, try reassign.
 */
export async function reassignTimedOutAssignments() {
  return enterBypassRls(() => reassignTimedOutAssignmentsInner());
}

async function reassignTimedOutAssignmentsInner() {
  const { ASSIGNMENT_ACCEPT_MINUTES } = await import("@2dcite/db");
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - ASSIGNMENT_ACCEPT_MINUTES);

  const stale = await prisma.job.findMany({
    where: {
      status: "ASSIGNED",
      acceptedAt: null,
      assignedAt: { lt: cutoff },
    },
  });

  for (const job of stale) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "QUEUED",
        studentId: null,
        assignedAt: null,
      },
    });
    await writeAudit({
      actorId: null,
      action: "job.assign_timeout",
      entityType: "Job",
      entityId: job.id,
      metadata: { previousStudentId: job.studentId },
    });
  }

  return stale.length;
}

export async function acceptAssignment(jobId: string, studentId: string) {
  // Timeout cleanup is system-wide
  await reassignTimedOutAssignments();

  // Student-scoped work under RLS
  return enterUserRls({ id: studentId, role: "STUDENT" }, async () => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }
  if (job.studentId !== studentId) {
    throw Object.assign(new Error("Not your assignment"), { status: 403 });
  }
  if (job.status !== "ASSIGNED") {
    throw Object.assign(
      new Error(`Job is ${job.status}, not ASSIGNED`),
      { status: 400 }
    );
  }

  // Enforce one active IN_REVIEW/ASSIGNED (this one is ASSIGNED already)
  const otherActive = await prisma.job.count({
    where: {
      studentId,
      id: { not: jobId },
      status: { in: ["ASSIGNED", "IN_REVIEW"] },
    },
  });
  if (otherActive > 0) {
    throw Object.assign(
      new Error("You already have another active assignment"),
      { status: 400 }
    );
  }

  const now = new Date();
  const dueAt = reviewDueAt(
    job.turnaroundTier as "STANDARD_48H" | "RUSH",
    now
  );

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "IN_REVIEW",
      acceptedAt: now,
      dueAt,
    },
    include: {
      payment: true,
      payout: true,
      certificate: true,
      student: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await writeAudit({
    actorId: studentId,
    action: "job.accepted",
    entityType: "Job",
    entityId: jobId,
    metadata: { dueAt: dueAt.toISOString() },
  });

  return updated;
  });
}

export async function declineAssignment(jobId: string, studentId: string) {
  return enterUserRls({ id: studentId, role: "STUDENT" }, async () => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }
  if (job.studentId !== studentId) {
    throw Object.assign(new Error("Not your assignment"), { status: 403 });
  }
  if (job.status !== "ASSIGNED") {
    throw Object.assign(
      new Error(`Can only decline ASSIGNED jobs (status: ${job.status})`),
      { status: 400 }
    );
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "QUEUED",
      studentId: null,
      assignedAt: null,
    },
  });

  await writeAudit({
    actorId: studentId,
    action: "job.declined",
    entityType: "Job",
    entityId: jobId,
  });

  // Re-assign uses system bypass (other students)
  const reassigned = await assignJobIfPossible(jobId, [studentId]);
  return reassigned;
  });
}
