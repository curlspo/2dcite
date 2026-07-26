import { submitReviewSchema } from "@2dcite/shared";
import { requireRole } from "@/lib/session";
import { submitReview } from "@/lib/review";
import { serializeJob } from "@/lib/jobs";
import { handleRouteError, jsonOk } from "@/lib/http";
import { processMatchingQueue } from "@/lib/matching";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ["STUDENT"]);
    const { id } = await context.params;
    const body = submitReviewSchema.parse(await request.json());
    const { job, review } = await submitReview(id, user.id, body);

    // Free student — try assign next queued job to anyone available
    await processMatchingQueue(5);

    return jsonOk({
      job: serializeJob(job),
      review: {
        id: review.id,
        submittedAt: review.submittedAt,
        findingsCount: Array.isArray(review.findings)
          ? review.findings.length
          : 0,
      },
      certificate: job.certificate
        ? {
            certNumber: job.certificate.certNumber,
            issuedAt: job.certificate.issuedAt,
            downloadPath: `/api/v1/jobs/${id}/certificate?download=1`,
          }
        : null,
      message:
        "Review submitted. Certificate of Citation Review issued. Student share released from hold; platform fee retained.",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
