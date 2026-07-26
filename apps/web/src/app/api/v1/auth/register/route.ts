import { prisma } from "@2dcite/db";
import { registerBodySchema } from "@2dcite/shared";
import { hashPassword } from "@/lib/password";
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
    const body = registerBodySchema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        role: body.role,
        passwordHash,
        ...(body.role === "STUDENT"
          ? {
              // Placeholder profile until application submitted — not matchable
              studentProfile: {
                create: {
                  lawSchool: "",
                  year: "L2",
                  legalWritingCoursePassed: false,
                  status: "PENDING",
                },
              },
            }
          : body.role === "ATTORNEY" || body.role === "JUDGE"
            ? { clientProfile: { create: {} } }
            : {}),
      },
      include: { studentProfile: true },
    });

    const { token, expiresAt } = await createSession(user.id);
    await writeAudit({
      actorId: user.id,
      action: "user.register",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role },
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
