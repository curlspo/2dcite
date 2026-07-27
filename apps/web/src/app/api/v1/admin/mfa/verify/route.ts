import { prisma } from "@2dcite/db";
import { z } from "zod";
import { verifyPassword } from "@/lib/password";
import {
  requireSession,
  markSessionMfaVerified,
  markSessionStepUp,
  toMeResponse,
} from "@/lib/session";
import { decryptSecret, verifyTotp } from "@/lib/totp";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  code: z.string().min(6).max(32),
  /** When true, only elevate step-up (session already MFA-verified) */
  stepUp: z.boolean().optional(),
});

/**
 * POST — verify TOTP/backup for MFA gate or step-up elevation.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireSession(request);
    if (ctx.user.role !== "ADMIN") {
      return jsonError("Forbidden", 403, "FORBIDDEN");
    }

    const ip = clientIp(request);
    const rl = await rateLimit(`mfa-verify:${ctx.user.id}`, 30, 15 * 60 * 1000);
    if (!rl.ok) {
      return jsonError("Too many requests", 429, "RATE_LIMITED", {
        retryAfterSec: rl.retryAfterSec,
      });
    }

    const body = bodySchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
    if (!user?.mfaEnabled || !user.mfaSecretEnc) {
      return jsonError("MFA not enabled", 400, "BAD_REQUEST");
    }

    const code = body.code.replace(/\s/g, "");
    let ok = false;
    try {
      const secret = decryptSecret(user.mfaSecretEnc);
      ok = verifyTotp(secret, code);
    } catch {
      ok = false;
    }

    if (!ok && user.mfaBackupCodesJson) {
      try {
        const hashes = JSON.parse(user.mfaBackupCodesJson) as string[];
        for (let i = 0; i < hashes.length; i++) {
          if (await verifyPassword(code, hashes[i])) {
            const next = [...hashes];
            next.splice(i, 1);
            await prisma.user.update({
              where: { id: user.id },
              data: {
                mfaBackupCodesJson:
                  next.length > 0 ? JSON.stringify(next) : null,
              },
            });
            ok = true;
            break;
          }
        }
      } catch {
        ok = false;
      }
    }

    if (!ok) {
      await writeAudit({
        actorId: user.id,
        action: "admin.mfa_verify_failed",
        entityType: "User",
        entityId: user.id,
        metadata: { ip, stepUp: Boolean(body.stepUp) },
      });
      return jsonError("Unable to complete this request.", 401, "UNAUTHORIZED");
    }

    if (body.stepUp) {
      await markSessionStepUp(ctx.session.id);
      await writeAudit({
        actorId: user.id,
        action: "admin.step_up",
        entityType: "User",
        entityId: user.id,
        metadata: { ip },
      });
    } else {
      await markSessionMfaVerified(ctx.session.id);
      await writeAudit({
        actorId: user.id,
        action: "admin.mfa_verified",
        entityType: "User",
        entityId: user.id,
        metadata: { ip },
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: ctx.session.id },
    });
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { studentProfile: true },
    });

    return jsonOk({
      ok: true,
      user: full ? toMeResponse(full, session) : null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
