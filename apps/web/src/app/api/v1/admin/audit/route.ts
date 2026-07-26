import { prisma } from "@2dcite/db";
import { requireRole } from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";

/** GET /api/v1/admin/audit?limit=50 */
export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const url = new URL(request.url);
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit") || 50))
    );

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return jsonOk({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        createdAt: l.createdAt,
        actor: l.actor,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
