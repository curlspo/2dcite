import { prisma } from "@2dcite/db";
import { requireUser } from "@/lib/session";
import { readUpload } from "@/lib/storage";
import { issueCertificateAndReleaseFunds } from "@/lib/certificates";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

/**
 * GET — metadata or ?download=1 for PDF bytes
 * Client, assigned student, or admin.
 * If job COMPLETED without cert (legacy Phase 3 rows), issues cert on demand.
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

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        certificate: true,
        payout: true,
        client: true,
        student: true,
      },
    });
    if (!job) return jsonError("Job not found", 404);

    const allowed =
      user.role === "ADMIN" ||
      job.clientId === user.id ||
      job.studentId === user.id;
    if (!allowed) return jsonError("Forbidden", 403);

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
      return jsonError(
        "Certificate not available yet. Complete student review first.",
        404,
        "NO_CERTIFICATE"
      );
    }

    if (download) {
      if (!certificate.pdfKey) {
        return jsonError("Certificate PDF missing", 404);
      }
      const buf = await readUpload(certificate.pdfKey);
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${certificate.certNumber}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    return jsonOk({
      certificate: {
        id: certificate.id,
        certNumber: certificate.certNumber,
        issuedAt: certificate.issuedAt,
        documentTitle: certificate.documentTitle,
        clientName: certificate.clientName,
        studentName: certificate.studentName,
        lawSchool: certificate.lawSchool,
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
