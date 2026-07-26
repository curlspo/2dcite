import { requireUser, toMeResponse } from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return jsonOk(toMeResponse(user));
  } catch (err) {
    return handleRouteError(err);
  }
}
