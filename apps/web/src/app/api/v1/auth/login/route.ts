import { prisma } from "@2dcite/db";
import { loginBodySchema } from "@2dcite/shared";
import { verifyPassword } from "@/lib/password";
import {
  createSession,
  sessionCookieOptions,
  SESSION_COOKIE,
  toMeResponse,
} from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const ipLimit = rateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
    if (!ipLimit.ok) {
      return jsonError(
        "Too many login attempts. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: ipLimit.retryAfterSec }
      );
    }

    const body = loginBodySchema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    const emailLimit = rateLimit(`login:email:${email}`, 15, 15 * 60 * 1000);
    if (!emailLimit.ok) {
      return jsonError(
        "Too many login attempts for this account. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: emailLimit.retryAfterSec }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true },
    });

    if (!user?.passwordHash) {
      return jsonError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return jsonError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const { token, expiresAt } = await createSession(user.id);
    await writeAudit({
      actorId: user.id,
      action: "user.login",
      entityType: "User",
      entityId: user.id,
    });

    const res = jsonOk({
      token,
      user: toMeResponse(user),
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
