import { requireSession, toMeResponse } from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const ctx = await requireSession(request);
    return jsonOk(toMeResponse(ctx.user, ctx.session));
  } catch (err) {
    return handleRouteError(err);
  }
}
