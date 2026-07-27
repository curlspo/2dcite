import { requireRole } from "@/lib/session";
import { acceptAssignment } from "@/lib/matching";
import { serializeJob } from "@/lib/jobs";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ["STUDENT"]);
    const { id } = await context.params;
    const job = await acceptAssignment(id, user.id);
    return jsonOk({ job: serializeJob(job, user) });
  } catch (err) {
    return handleRouteError(err);
  }
}
