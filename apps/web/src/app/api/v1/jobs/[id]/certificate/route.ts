import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { readUpload } from "@/lib/storage";
import { issueCertificateAndReleaseFunds } from "@/lib/certificates";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimitPaidApi } from "@/lib/rate-limit";

/**
 * GET — metadata or ?download=1 for PDF bytes (Blob read when downloading).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "1";

    // Downloads (and on-demand cert generation) hit Blob storage
    if (download) {
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
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        certificate: true,
        payout: true,
        client: true,
        student: true,
      },
    });
    // Uniform 404 for missing and unauthorized (reduces IDOR oracle)
    if (!job) return jsonError("Not found", 404, "NOT_FOUND");

    const allowed =
      user.role === "ADMIN" ||
      job.clientId === user.id ||
      job.studentId === user.id;
    if (!allowed) return jsonError("Not found", 404, "NOT_FOUND");

    // Backfill cert for COMPLETED jobs from before Phase 4
    let certificate = job.certificate;
    let payout = job.payout;
    let jobStatus = job.status;

    if (
      !certificate &&
      (job.status === "COMPLETED" || job.status === "CERTIFIED")
    ) {
      const issued = await issueCertificateAndReleaseFunds(id);
      certificate = issued.certificate;
      payout = issued.payout;
      jobStatus = issued.status;
    }

    if (!certificate) {
      return jsonError("Not found", 404, "NOT_FOUND");
    }

    if (download) {
      if (!certificate.pdfKey) {
        return jsonError("Not found", 404, "NOT_FOUND");
      }
      const buf = await readUpload(certificate.pdfKey);
      const safeName = certificate.certNumber.replace(/[^\w.\-]+/g, "_");
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Blind matching: never return studentName/lawSchool to non-admin clients
    const revealStudent =
      user.role === "ADMIN" || user.role === "STUDENT";

    return jsonOk({
      certificate: {
        id: certificate.id,
        certNumber: certificate.certNumber,
        issuedAt: certificate.issuedAt,
        documentTitle: certificate.documentTitle,
        clientName: certificate.clientName,
        studentName: revealStudent ? certificate.studentName : null,
        lawSchool: revealStudent ? certificate.lawSchool : null,
        reviewerLabel: "Independent qualified law-student reviewer",
        scopeVersion: certificate.scopeVersion,
        downloadPath: `/api/v1/jobs/${id}/certificate?download=1`,
      },
      payout: payout
        ? {
            status: payout.status,
            studentAmountCents: payout.studentAmountCents,
            releasedAt: payout.releasedAt,
          }
        : null,
      jobStatus,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
