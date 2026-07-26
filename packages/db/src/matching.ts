import type { PrismaClient } from "@prisma/client";

/**
 * Students eligible for auto-assign:
 * - role STUDENT (via profile relation)
 * - status APPROVED
 * - zero active jobs (ASSIGNED or IN_REVIEW)
 */
export async function findNextAvailableStudent(prisma: PrismaClient) {
  const candidates = await prisma.studentProfile.findMany({
    where: { status: "APPROVED" },
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
