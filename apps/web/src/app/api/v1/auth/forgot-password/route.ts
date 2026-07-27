import { createHash, randomBytes } from "crypto";
import { rawPrisma } from "@2dcite/db";
import { z } from "zod";
import { sanitizeEmail } from "@2dcite/shared";
import { writeAudit } from "@/lib/audit";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit, rateLimitPaidApi } from "@/lib/rate-limit";
import { captchaTokenFromBody, verifyCaptchaToken } from "@/lib/captcha";

const bodySchema = z.object({
  email: z.string().email().max(320),
  captchaToken: z.string().optional(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * POST /auth/forgot-password
 * May call Resend (paid email API). Always same success message.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const paidRl = await rateLimitPaidApi("email", { ip });
    if (!paidRl.ok) {
      return jsonError(
        "Too many requests. Please try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: paidRl.retryAfterSec }
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
    const email = sanitizeEmail(body.email);

    const emailLimit = await rateLimit(
      `forgot:email:${email}`,
      5,
      60 * 60 * 1000
    );
    if (!emailLimit.ok) {
      return jsonError(
        "Too many requests. Please try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: emailLimit.retryAfterSec }
      );
    }

    // Generic response text (always the same)
    const genericMessage =
      "If an account exists for that email, we sent password recovery instructions. Check your inbox and spam folder.";

    const user = await rawPrisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      await writeAudit({
        actorId: null,
        action: "user.password_reset_requested",
        entityType: "User",
        entityId: null,
        metadata: { emailDomain: email.split("@")[1] ?? null, found: false, ip },
      }).catch(() => {});
    } else {
      // Invalidate prior unused tokens for this user
      await rawPrisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await rawPrisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        "https://2dcite.com";
      const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      const mail = passwordResetEmail({
        name: user.name || "there",
        resetUrl,
      });

      const sent = await sendEmail({
        to: user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });

      await writeAudit({
        actorId: user.id,
        action: "user.password_reset_requested",
        entityType: "User",
        entityId: user.id,
        metadata: {
          ip,
          found: true,
          emailSent: sent.ok,
          emailMode: sent.ok ? sent.mode : sent.error,
        },
      }).catch(() => {});
    }

    return jsonOk({ message: genericMessage });
  } catch (err) {
    return handleRouteError(err);
  }
}
