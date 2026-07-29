import { randomInt } from "crypto";
import { prisma } from "@2dcite/db";

/**
 * Client-facing anonymous reviewer number (e.g. R-482917).
 * Never the student's real name — assigned when a job is matched.
 */
export function formatReviewerCode(n: number): string {
  return `R-${String(n).padStart(6, "0")}`;
}

export function generateReviewerCodeCandidate(): string {
  return formatReviewerCode(randomInt(100000, 1000000));
}

/** Generate a code unique among active jobs (best-effort; rare collisions retry). */
export async function allocateReviewerCode(
  maxAttempts = 8
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateReviewerCodeCandidate();
    const taken = await prisma.job.findFirst({
      where: { reviewerCode: code, studentId: { not: null } },
      select: { id: true },
    });
    if (!taken) return code;
  }
  // Extremely unlikely fallback
  return `R-${Date.now().toString().slice(-6)}`;
}
