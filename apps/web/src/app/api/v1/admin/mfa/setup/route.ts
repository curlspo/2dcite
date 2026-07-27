import { prisma } from "@2dcite/db";
import { z } from "zod";
import { hashPassword } from "@/lib/password";
import {
  requireSession,
  markSessionMfaVerified,
  toMeResponse,
} from "@/lib/session";
import {
  decryptSecret,
  encryptSecret,
  generateBackupCodes,
  generateTotpSecret,
  totpAuthUrl,
  verifyTotp,
} from "@/lib/totp";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * GET — begin MFA setup (returns secret + otpauth URL). Does not enable MFA yet.
 * POST — confirm with TOTP code to enable MFA and issue backup codes.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireSession(request);
    if (ctx.user.role !== "ADMIN") {
      return jsonError("Forbidden", 403, "FORBIDDEN");
    }
    if (ctx.user.mfaEnabled) {
      return jsonError("MFA already enabled", 400, "BAD_REQUEST");
    }

    const secret = generateTotpSecret();
    // Stash pending secret on user until confirm (encrypted)
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { mfaSecretEnc: encryptSecret(secret) },
    });

    return jsonOk({
      secret,
      otpauthUrl: totpAuthUrl({
        secret,
        email: ctx.user.email,
        issuer: "2dcite",
      }),
      // Client can render QR from otpauthUrl
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

const confirmSchema = z.object({
  code: z.string().min(6).max(12),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireSession(request);
    if (ctx.user.role !== "ADMIN") {
      return jsonError("Forbidden", 403, "FORBIDDEN");
    }

    const ip = clientIp(request);
    const rl = await rateLimit(`mfa-setup:${ctx.user.id}`, 20, 60 * 60 * 1000);
    if (!rl.ok) {
      return jsonError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = confirmSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
    if (!user?.mfaSecretEnc) {
      return jsonError("Start MFA setup first", 400, "BAD_REQUEST");
    }

    let secret: string;
    try {
      secret = decryptSecret(user.mfaSecretEnc);
    } catch {
      return jsonError("Unable to complete this request.", 400, "BAD_REQUEST");
    }

    if (!verifyTotp(secret, body.code.replace(/\s/g, ""))) {
      await writeAudit({
        actorId: user.id,
        action: "admin.mfa_setup_failed",
        entityType: "User",
        entityId: user.id,
        metadata: { ip },
      });
      return jsonError("Unable to complete this request.", 400, "BAD_REQUEST");
    }

    const backupPlain = generateBackupCodes(8);
    const backupHashes = await Promise.all(
      backupPlain.map((c) => hashPassword(c))
    );

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaBackupCodesJson: JSON.stringify(backupHashes),
      },
      include: { studentProfile: true },
    });

    await markSessionMfaVerified(ctx.session.id);
    await writeAudit({
      actorId: user.id,
      action: "admin.mfa_enabled",
      entityType: "User",
      entityId: user.id,
      metadata: { ip },
    });

    const refreshed = await prisma.session.findUnique({
      where: { id: ctx.session.id },
    });

    return jsonOk({
      enabled: true,
      backupCodes: backupPlain, // show once
      user: toMeResponse(updated, refreshed),
      message:
        "MFA enabled. Store backup codes offline — they will not be shown again.",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
