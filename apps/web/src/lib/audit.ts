import "server-only";
import { prisma, enterBypassRls, type Prisma } from "@2dcite/db";

export async function writeAudit(opts: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  // Audit inserts allowed under user RLS when actorId matches; use bypass
  // so system events (actorId null) always succeed.
  await enterBypassRls(async () => {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId ?? null,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        metadata: opts.metadata,
      },
    });
  });
}
