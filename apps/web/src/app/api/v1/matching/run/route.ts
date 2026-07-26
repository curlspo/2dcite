import { requireRole } from "@/lib/session";
import {
  processMatchingQueue,
  reassignTimedOutAssignments,
} from "@/lib/matching";
import { handleRouteError, jsonOk } from "@/lib/http";

/** POST — admin (or system) runs matching + timeout reassign */
export async function POST(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const timedOut = await reassignTimedOutAssignments();
    const assigned = await processMatchingQueue(50);
    return jsonOk({ timedOut, assignedJobIds: assigned });
  } catch (err) {
    return handleRouteError(err);
  }
}
