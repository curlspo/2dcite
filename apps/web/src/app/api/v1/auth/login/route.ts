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

export async function POST(request: Request) {
  try {
    const body = loginBodySchema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

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
