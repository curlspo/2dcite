import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { serializeJob } from "@/lib/jobs";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        payment: true,
        payout: true,
        certificate: true,
        review: true,
        student: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!job) return jsonError("Job not found", 404, "NOT_FOUND");

    const allowed =
      user.role === "ADMIN" ||
      job.clientId === user.id ||
      job.studentId === user.id;

    if (!allowed) return jsonError("Forbidden", 403, "FORBIDDEN");

    return jsonOk({ job: serializeJob(job, user) });
  } catch (err) {
    return handleRouteError(err);
  }
}
