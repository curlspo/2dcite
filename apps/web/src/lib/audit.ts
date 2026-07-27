import "server-only";
import { rawPrisma, type Prisma } from "@2dcite/db";

export async function writeAudit(opts: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  // System client — audit must never fail due to RLS role drop
  await rawPrisma.auditLog.create({
    data: {
      actorId: opts.actorId ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      metadata: opts.metadata,
    },
  });
}
