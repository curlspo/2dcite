import { prisma } from "@2dcite/db";
import { requireRole } from "@/lib/session";
import { handleRouteError, jsonOk } from "@/lib/http";

/** GET /api/v1/admin/students?status=PENDING */
export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const students = await prisma.studentProfile.findMany({
      where: status
        ? { status: status as "PENDING" | "APPROVED" | "REJECTED" }
        : undefined,
      include: {
        user: {
          select: { id: true, email: true, name: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk({
      students: students.map((s) => ({
        id: s.id,
        userId: s.userId,
        name: s.user.name,
        email: s.user.email,
        lawSchool: s.lawSchool,
        year: s.year,
        status: s.status,
        professorName: s.professorName,
        professorEmail: s.professorEmail,
        legalWritingCoursePassed: s.legalWritingCoursePassed,
        hasEnrollmentProof: Boolean(s.enrollmentProofKey),
        hasLegalWritingProof: Boolean(s.legalWritingProofKey),
        hasProfessorRec: Boolean(s.professorRecKey),
        rejectionReason: s.rejectionReason,
        reviewedAt: s.reviewedAt,
        createdAt: s.user.createdAt,
        updatedAt: s.updatedAt,
        applicationComplete: Boolean(
          s.lawSchool &&
            s.enrollmentProofKey &&
            s.legalWritingProofKey &&
            s.professorRecKey
        ),
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
