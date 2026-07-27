import { createHash } from "crypto";
import { prisma, enterBypassRls } from "@2dcite/db";
import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { captchaTokenFromBody, verifyCaptchaToken } from "@/lib/captcha";

const bodySchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10).max(128),
  captchaToken: z.string().optional(),
});

/**
 * POST /auth/reset-password
 * Consumes a one-time token and sets a new password hash.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const ipLimit = await rateLimit(`reset:ip:${ip}`, 20, 60 * 60 * 1000);
    if (!ipLimit.ok) {
      return jsonError(
        "Too many requests. Please try again later.",
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

    const body = bodySchema.parse(raw);
    const tokenHash = createHash("sha256").update(body.token).digest("hex");

    const result = await enterBypassRls(async () => {
      const row = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!row || row.usedAt || row.expiresAt < new Date()) {
        return { ok: false as const };
      }

      const passwordHash = await hashPassword(body.password);

      await prisma.$transaction(async (tx) => {
        const { applyRlsConfig } = await import("@2dcite/db");
        await applyRlsConfig(tx, { mode: "bypass", reason: "password_reset" });

        await tx.user.update({
          where: { id: row.userId },
          data: { passwordHash },
        });

        await tx.passwordResetToken.update({
          where: { id: row.id },
          data: { usedAt: new Date() },
        });

        // Invalidate other unused reset tokens
        await tx.passwordResetToken.updateMany({
          where: { userId: row.userId, usedAt: null, id: { not: row.id } },
          data: { usedAt: new Date() },
        });

        // Force re-login everywhere
        await tx.session.deleteMany({ where: { userId: row.userId } });
      });

      await writeAudit({
        actorId: row.userId,
        action: "user.password_reset_completed",
        entityType: "User",
        entityId: row.userId,
        metadata: { ip },
      }).catch(() => {});

      return { ok: true as const };
    });

    if (!result.ok) {
      return jsonError(
        "This reset link is invalid or has expired. Request a new one.",
        400,
        "BAD_REQUEST"
      );
    }

    return jsonOk({
      message: "Your password has been updated. You can sign in with the new password.",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
