import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { readUpload } from "@/lib/storage";
import { handleRouteError, jsonError } from "@/lib/http";

/** Stream job PDF for client, assigned student, or admin */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job?.pdfKey) return jsonError("Document not found", 404);

    const allowed =
      user.role === "ADMIN" ||
      job.clientId === user.id ||
      job.studentId === user.id;
    if (!allowed) return jsonError("Forbidden", 403);

    // Student may only view after assignment
    if (
      user.role === "STUDENT" &&
      !["ASSIGNED", "IN_REVIEW", "COMPLETED", "CERTIFIED"].includes(job.status)
    ) {
      return jsonError("Document not available yet", 403);
    }

    const buf = await readUpload(job.pdfKey);
    const fileName = job.pdfFileName || "document.pdf";

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
