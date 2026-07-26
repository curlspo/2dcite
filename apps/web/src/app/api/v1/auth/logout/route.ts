import {
  deleteSessionByToken,
  getTokenFromRequest,
  SESSION_COOKIE,
} from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const token = await getTokenFromRequest(request);
    if (token) {
      await deleteSessionByToken(token);
    }
    const res = jsonOk({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
