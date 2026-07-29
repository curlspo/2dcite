import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import {
  REVIEW_SCOPE_LABELS,
  ReviewScope,
  STUDENT_NO_AI_POLICY,
  STUDENT_REVIEW_ATTESTATION,
} from "@2dcite/shared";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { serializeJob } from "@/lib/jobs";
import { AssignmentActions } from "@/components/student/AssignmentActions";
import { ReviewForm } from "@/components/student/ReviewForm";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/dashboard");

  const { id } = await params;
  const jobRow = await prisma.job.findUnique({
    where: { id },
    include: {
      payment: true,
      payout: true,
      certificate: true,
      review: true,
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!jobRow || jobRow.studentId !== user.id) notFound();
  const job = serializeJob(jobRow, user);

  return (
    <AppShell user={user}>
      <Link href="/assignments" className="text-sm text-accent underline">
        ← Assignments
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
        {job.title}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Status: <strong className="text-ink">{job.status}</strong> ·{" "}
        {job.turnaroundTier}
        {job.dueAt ? ` · due ${new Date(job.dueAt).toLocaleString()}` : ""}
        {job.reviewerCode ? (
          <>
            {" "}
            · Your public code:{" "}
            <span className="font-mono font-medium text-ink">
              {job.reviewerCode}
            </span>
          </>
        ) : null}
      </p>

      <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium text-ink">Requested review type</p>
        <p className="mt-1 text-muted">
          {REVIEW_SCOPE_LABELS[
            (job.reviewScope as keyof typeof REVIEW_SCOPE_LABELS) ||
              ReviewScope.EXISTENCE_ONLY
          ] ?? job.reviewScope}
        </p>
        <p className="mt-2 text-xs text-muted">{STUDENT_NO_AI_POLICY}</p>
      </div>

      {job.instructions && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm">
          <p className="font-medium text-ink">Client instructions</p>
          <p className="mt-1 whitespace-pre-wrap text-muted">{job.instructions}</p>
        </div>
      )}

      <div className="mt-4">
        <a
          href={`/api/v1/jobs/${job.id}/document`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-accent underline"
        >
          Open PDF document ↗
        </a>
        <p className="mt-1 text-xs text-muted">
          {job.pdfFileName || "document.pdf"} — confidential; for review only.
        </p>
      </div>

      <AssignmentActions jobId={job.id} status={job.status} />

      {job.status === "IN_REVIEW" && !job.review && (
        <>
          <p className="mt-8 text-sm text-muted">
            Record findings for each citation or issue area. Your work is an
            independent verification layer only — not legal advice. Do not use
            generative AI.
          </p>
          <ReviewForm jobId={job.id} reviewScope={job.reviewScope} />
        </>
      )}

      {job.review && (
        <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm">
          <p className="font-medium text-ink">Submitted review</p>
          <p className="mt-1 text-muted">
            {new Date(job.review.submittedAt).toLocaleString()}
          </p>
          <pre className="mt-3 max-h-64 overflow-auto rounded bg-background p-3 text-xs text-muted">
            {JSON.stringify(job.review.findings, null, 2)}
          </pre>
          {job.review.overallNotes && (
            <p className="mt-3 text-muted">{job.review.overallNotes}</p>
          )}
          <p className="mt-4 text-xs text-muted">
            Attested: {STUDENT_REVIEW_ATTESTATION.slice(0, 100)}…
          </p>
        </div>
      )}

      {(job.status === "COMPLETED" || job.status === "CERTIFIED") && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted">
          <p className="font-medium text-ink">
            {job.status === "CERTIFIED"
              ? "Certificate issued"
              : "Review complete"}
          </p>
          {job.certificate && (
            <>
              <p className="mt-1">
                {job.certificate.certNumber} ·{" "}
                {new Date(job.certificate.issuedAt).toLocaleString()}
              </p>
              <a
                href={`/api/v1/jobs/${job.id}/certificate?download=1`}
                className="mt-2 inline-block text-accent underline"
              >
                Download certificate PDF
              </a>
            </>
          )}
          {job.payout && (
            <p className="mt-2">
              Your share: payout status <strong>{job.payout.status}</strong>
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
