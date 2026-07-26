import { z } from "zod";
import { requireRole } from "@/lib/session";
import { adminReassignJob } from "@/lib/admin-ops";
import { handleRouteError, jsonOk } from "@/lib/http";

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const result = await adminReassignJob(id, admin.id, body.reason);
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
