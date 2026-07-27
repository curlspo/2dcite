import { rawPrisma } from "@2dcite/db";
import { loginBodySchema } from "@2dcite/shared";
import { z } from "zod";
import { verifyPasswordOrDummy, verifyPassword } from "@/lib/password";
import {
  createSession,
  sessionCookieOptions,
  SESSION_COOKIE,
  toMeResponse,
  getSessionByToken,
  markSessionMfaVerified,
} from "@/lib/session";
import { decryptSecret, verifyTotp } from "@/lib/totp";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { captchaTokenFromBody, verifyCaptchaToken } from "@/lib/captcha";

const loginSchema = loginBodySchema.extend({
  mfaCode: z.string().min(6).max(32).optional(),
  captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const ipLimit = await rateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
    if (!ipLimit.ok) {
      return jsonError(
        "Too many login attempts. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: ipLimit.retryAfterSec }
      );
    }

    const raw = await request.json();
    // Require captcha on password step (not on MFA-only re-submit with same session flow)
    const bodyPreview = loginSchema.safeParse(raw);
    const needsCaptcha = !bodyPreview.success || !bodyPreview.data.mfaCode;
    if (needsCaptcha) {
      const captcha = await verifyCaptchaToken(captchaTokenFromBody(raw), ip);
      if (!captcha.ok) {
        return jsonError(
          "Please complete the security check and try again.",
          400,
          "CAPTCHA_FAILED"
        );
      }
    }

    const body = loginSchema.parse(raw);
    const email = body.email.toLowerCase().trim();

    const emailLimit = await rateLimit(
      `login:email:${email}`,
      15,
      15 * 60 * 1000
    );
    if (!emailLimit.ok) {
      return jsonError(
        "Too many login attempts for this account. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: emailLimit.retryAfterSec }
      );
    }

    const user = await rawPrisma.user.findUnique({
      where: { email },
      include: { studentProfile: true },
    });

    const valid = await verifyPasswordOrDummy(
      body.password,
      user?.passwordHash
    );

    if (!user || !valid) {
      await writeAudit({
        actorId: null,
        action: "user.login_failed",
        entityType: "User",
        entityId: null,
        metadata: { emailDomain: email.split("@")[1] ?? null, ip },
      }).catch(() => {});
      return jsonError("Invalid email or password", 401, "UNAUTHORIZED");
    }

    const needsMfa = user.role === "ADMIN" && user.mfaEnabled;

    if (needsMfa && !body.mfaCode) {
      return jsonOk({
        mfaRequired: true,
        message: "MFA code required",
      });
    }

    if (needsMfa && body.mfaCode) {
      const mfaOk = await verifyAdminMfaCode(user, body.mfaCode);
      if (!mfaOk) {
        await writeAudit({
          actorId: user.id,
          action: "user.mfa_failed",
          entityType: "User",
          entityId: user.id,
          metadata: { ip },
        }).catch(() => {});
        return jsonError(
          "Unable to complete this request.",
          401,
          "UNAUTHORIZED"
        );
      }
    }

    // Non-admin, or admin without MFA yet, or MFA just verified → mark verified
    const mfaVerified = !needsMfa || Boolean(body.mfaCode);

    const { token, expiresAt } = await createSession(user.id, {
      mfaVerified,
    });

    if (mfaVerified) {
      const ctx = await getSessionByToken(token);
      if (ctx) await markSessionMfaVerified(ctx.session.id);
    }

    await writeAudit({
      actorId: user.id,
      action: "user.login",
      entityType: "User",
      entityId: user.id,
      metadata: { ip, mfa: needsMfa },
    });

    const ctx = await getSessionByToken(token);
    const res = jsonOk({
      token,
      mfaRequired: false,
      mfaSetupRequired: user.role === "ADMIN" && !user.mfaEnabled,
      user: toMeResponse(user, ctx?.session),
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}

async function verifyAdminMfaCode(
  user: {
    id: string;
    mfaSecretEnc: string | null;
    mfaBackupCodesJson: string | null;
  },
  code: string
): Promise<boolean> {
  const trimmed = code.replace(/\s/g, "");
  if (user.mfaSecretEnc) {
    try {
      const secret = decryptSecret(user.mfaSecretEnc);
      if (verifyTotp(secret, trimmed)) return true;
    } catch {
      /* backup codes */
    }
  }
  if (user.mfaBackupCodesJson) {
    try {
      const hashes = JSON.parse(user.mfaBackupCodesJson) as string[];
      for (let i = 0; i < hashes.length; i++) {
        if (await verifyPassword(trimmed, hashes[i])) {
          const next = [...hashes];
          next.splice(i, 1);
          await rawPrisma.user.update({
            where: { id: user.id },
            data: {
              mfaBackupCodesJson:
                next.length > 0 ? JSON.stringify(next) : null,
            },
          });
          return true;
        }
      }
    } catch {
      return false;
    }
  }
  return false;
}
