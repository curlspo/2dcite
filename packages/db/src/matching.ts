import type { PrismaClient, User } from "@prisma/client";

/** Defaults mirrored from @2dcite/shared PRICING_DEFAULTS (keep in sync). */
const ASSIGNMENT_ACCEPT_MINUTES = 60;
const STANDARD_SLA_HOURS = 48;
const RUSH_SLA_HOURS = 24;

/**
 * Students eligible for auto-assign:
 * - profile status APPROVED
 * - zero active jobs (ASSIGNED or IN_REVIEW)
 */
export async function findNextAvailableStudent(
  prisma: PrismaClient,
  excludeUserIds: string[] = []
): Promise<User | null> {
  const candidates = await prisma.studentProfile.findMany({
    where: {
      status: "APPROVED",
      ...(excludeUserIds.length
        ? { userId: { notIn: excludeUserIds } }
        : {}),
    },
    include: {
      user: {
        include: {
          jobsAsStudent: {
            where: {
              status: { in: ["ASSIGNED", "IN_REVIEW"] },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  for (const profile of candidates) {
    if (profile.user.jobsAsStudent.length === 0) {
      return profile.user;
    }
  }
  return null;
}

/** Next QUEUED job: rush first, then oldest. */
export async function findNextQueuedJob(prisma: PrismaClient) {
  const rush = await prisma.job.findFirst({
    where: { status: "QUEUED", turnaroundTier: "RUSH", studentId: null },
    orderBy: { createdAt: "asc" },
  });
  if (rush) return rush;

  return prisma.job.findFirst({
    where: { status: "QUEUED", studentId: null },
    orderBy: { createdAt: "asc" },
  });
}

export function assignmentDeadline(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setMinutes(d.getMinutes() + ASSIGNMENT_ACCEPT_MINUTES);
  return d;
}

export function reviewDueAt(
  tier: "STANDARD_48H" | "RUSH",
  from: Date = new Date()
): Date {
  const hours = tier === "RUSH" ? RUSH_SLA_HOURS : STANDARD_SLA_HOURS;
  const d = new Date(from);
  d.setHours(d.getHours() + hours);
  return d;
}

export { ASSIGNMENT_ACCEPT_MINUTES };
