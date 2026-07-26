import { prisma } from "@2dcite/db";
import { requireRole } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(request, ["ADMIN"]);
    const { id } = await context.params;

    const profile = await prisma.studentProfile.findUnique({ where: { id } });
    if (!profile) {
      return jsonError("Student profile not found", 404, "NOT_FOUND");
    }

    if (
      !profile.lawSchool ||
      !profile.enrollmentProofKey ||
      !profile.legalWritingProofKey ||
      !profile.professorRecKey ||
      !profile.legalWritingCoursePassed
    ) {
      return jsonError(
        "Cannot approve incomplete application",
        400,
        "INCOMPLETE"
      );
    }

    const updated = await prisma.studentProfile.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        rejectionReason: null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    await writeAudit({
      actorId: admin.id,
      action: "student.approve",
      entityType: "StudentProfile",
      entityId: id,
      metadata: { userId: updated.userId },
    });

    return jsonOk({
      student: {
        id: updated.id,
        status: updated.status,
        name: updated.user.name,
        email: updated.user.email,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
