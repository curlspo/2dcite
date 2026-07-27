import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { readUpload } from "@/lib/storage";
import { handleRouteError, jsonError } from "@/lib/http";
import { safeContentDispositionFilename } from "@/lib/security";
import { clientIp, rateLimitPaidApi } from "@/lib/rate-limit";

/** Stream job PDF — may hit Vercel Blob (paid). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const paidRl = await rateLimitPaidApi("blobRead", {
      userId: user.id,
      ip: clientIp(request),
    });
    if (!paidRl.ok) {
      return jsonError(
        "Too many download requests. Please try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: paidRl.retryAfterSec }
      );
    }
    const { id } = await context.params;

    const job = await prisma.job.findUnique({ where: { id } });
    // Uniform not-found to reduce existence oracle for unauthorized users
    if (!job?.pdfKey) return jsonError("Not found", 404, "NOT_FOUND");

    const allowed =
      user.role === "ADMIN" ||
      job.clientId === user.id ||
      job.studentId === user.id;
    if (!allowed) return jsonError("Not found", 404, "NOT_FOUND");

    // Student may only view after assignment
    if (
      user.role === "STUDENT" &&
      !["ASSIGNED", "IN_REVIEW", "COMPLETED", "CERTIFIED"].includes(job.status)
    ) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    // Path traversal defense: keys are always under users/{owner}/
    if (
      user.role !== "ADMIN" &&
      job.pdfKey &&
      !job.pdfKey.startsWith(`users/${job.clientId}/`)
    ) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    const buf = await readUpload(job.pdfKey);
    const fileName = safeContentDispositionFilename(
      job.pdfFileName || "document.pdf"
    );

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
