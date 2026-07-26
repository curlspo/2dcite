import { requireRole } from "@/lib/session";
import { declineAssignment } from "@/lib/matching";
import { serializeJob } from "@/lib/jobs";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ["STUDENT"]);
    const { id } = await context.params;
    const job = await declineAssignment(id, user.id);
    return jsonOk({
      ok: true,
      reassigned: Boolean(job && job.studentId && job.studentId !== user.id),
      job: job ? serializeJob(job) : null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
