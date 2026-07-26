import { prisma } from "@2dcite/db";
import { requireRole } from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";
import { formatUsd } from "@/lib/jobs";

/** GET /api/v1/admin/payouts?status=HELD */
export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as
      | "HELD"
      | "RELEASED"
      | "REFUNDED"
      | null;

    const payouts = await prisma.payout.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            clientId: true,
            studentId: true,
          },
        },
      },
    });

    return jsonOk({
      payouts: payouts.map((p) => ({
        id: p.id,
        jobId: p.jobId,
        jobTitle: p.job.title,
        jobStatus: p.job.status,
        studentId: p.studentId,
        status: p.status,
        grossCents: p.grossCents,
        platformFeeCents: p.platformFeeCents,
        studentAmountCents: p.studentAmountCents,
        studentAmountDisplay: formatUsd(p.studentAmountCents),
        heldAt: p.heldAt,
        releasedAt: p.releasedAt,
        stripeTransferId: p.stripeTransferId,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
