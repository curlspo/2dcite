import { prisma, enterBypassRls } from "@2dcite/db";
import { isEduEmail, registerBodySchema } from "@2dcite/shared";
import { hashPassword } from "@/lib/password";
import {
  createSession,
  sessionCookieOptions,
  SESSION_COOKIE,
  toMeResponse,
} from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { captchaTokenFromBody, verifyCaptchaToken } from "@/lib/captcha";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const ipLimit = await rateLimit(`register:ip:${ip}`, 8, 60 * 60 * 1000);
    if (!ipLimit.ok) {
      return jsonError(
        "Too many signup attempts from this network. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: ipLimit.retryAfterSec }
      );
    }

    const raw = await request.json();
    const captcha = await verifyCaptchaToken(captchaTokenFromBody(raw), ip);
    if (!captcha.ok) {
      return jsonError(
        "Please complete the security check and try again.",
        400,
        "CAPTCHA_FAILED"
      );
    }

    const body = registerBodySchema.parse(raw);
    const email = body.email.toLowerCase().trim();
    const name = body.name.trim();
    const barNumber = body.barNumber?.trim() || null;
    const barState = body.barState?.trim().toUpperCase() || null;

    const emailLimit = await rateLimit(`register:email:${email}`, 5, 60 * 60 * 1000);
    if (!emailLimit.ok) {
      return jsonError(
        "Too many signup attempts for this email. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: emailLimit.retryAfterSec }
      );
    }

    // Defense in depth (schema also enforces)
    if (body.role === "STUDENT" && !isEduEmail(email)) {
      return jsonError(
        "Student accounts require a .edu email address from an accredited law school.",
        400,
        "EDU_EMAIL_REQUIRED"
      );
    }
    if (body.role === "ATTORNEY" || body.role === "JUDGE") {
      if (!barState) {
        return jsonError(
          "Select the state where your bar or judicial license is issued.",
          400,
          "BAR_STATE_REQUIRED"
        );
      }
      if (!barNumber) {
        return jsonError(
          "Attorneys and judges must provide a state bar or judicial license number.",
          400,
          "BAR_NUMBER_REQUIRED"
        );
      }
    }

    const existing = await enterBypassRls(() =>
      prisma.user.findUnique({ where: { email } })
    );
    if (existing) {
      return jsonError(
        "An account with this email already exists",
        409,
        "EMAIL_TAKEN"
      );
    }

    const passwordHash = await hashPassword(body.password);

    const user = await enterBypassRls(() =>
      prisma.user.create({
        data: {
          email,
          name,
          role: body.role,
          passwordHash,
          ...(body.role === "STUDENT"
            ? {
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
              ? {
                  clientProfile: {
                    create: {
                      barNumber: barNumber!,
                      barState: barState!,
                    },
                  },
                }
              : {}),
        },
        include: { studentProfile: true, clientProfile: true },
      })
    );

    const { token, expiresAt } = await createSession(user.id);
    await writeAudit({
      actorId: user.id,
      action: "user.register",
      entityType: "User",
      entityId: user.id,
      metadata: {
        role: user.role,
        eduEmail: body.role === "STUDENT",
        hasBarNumber: Boolean(barNumber),
        barState: barState || undefined,
      },
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
