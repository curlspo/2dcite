import {
  clearSessionCookieOptions,
  deleteSessionByToken,
  getTokenFromRequest,
  SESSION_COOKIE,
} from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { getUserByToken } from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const token = await getTokenFromRequest(request);
    if (token) {
      const user = await getUserByToken(token);
      await deleteSessionByToken(token);
      if (user) {
        await writeAudit({
          actorId: user.id,
          action: "user.logout",
          entityType: "User",
          entityId: user.id,
        }).catch(() => {});
      }
    }
    const res = jsonOk({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", clearSessionCookieOptions());
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
