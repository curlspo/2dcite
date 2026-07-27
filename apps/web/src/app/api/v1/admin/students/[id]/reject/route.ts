import { prisma } from "@2dcite/db";
import { z } from "zod";
import { requireAdminStepUp } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

const bodySchema = z.object({
  reason: z.string().min(3).max(1000).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user: admin } = await requireAdminStepUp(request);
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json().catch(() => ({})));

    const profile = await prisma.studentProfile.findUnique({ where: { id } });
    if (!profile) {
      return jsonError("Student profile not found", 404, "NOT_FOUND");
    }

    const updated = await prisma.studentProfile.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        rejectionReason:
          body.reason ||
          "Application did not meet eligibility requirements.",
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    await writeAudit({
      actorId: admin.id,
      action: "student.reject",
      entityType: "StudentProfile",
      entityId: id,
      metadata: { userId: updated.userId, reason: updated.rejectionReason },
    });

    return jsonOk({
      student: {
        id: updated.id,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
        name: updated.user.name,
        email: updated.user.email,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
