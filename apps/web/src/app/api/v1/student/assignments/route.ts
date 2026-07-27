import { prisma } from "@2dcite/db";
import { requireRole } from "@/lib/session";
import { serializeJob } from "@/lib/jobs";
import { reassignTimedOutAssignments } from "@/lib/matching";
import { handleRouteError, jsonOk } from "@/lib/http";
import { isStudentEligibleForMatching } from "@/lib/eligibility";
import { studentGateMessage } from "@/lib/eligibility";

/** GET current student's assignments (active + recent) */
export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ["STUDENT"]);
    await reassignTimedOutAssignments();

    const jobs = await prisma.job.findMany({
      where: { studentId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        payment: true,
        payout: true,
        certificate: true,
        review: true,
        student: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const active = jobs.filter((j) =>
      ["ASSIGNED", "IN_REVIEW"].includes(j.status)
    );

    return jsonOk({
      eligibleForMatching: isStudentEligibleForMatching(user),
      gateMessage: studentGateMessage(user),
      active: active.map((j) => serializeJob(j, user)),
      history: jobs.map((j) => serializeJob(j, user)),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
