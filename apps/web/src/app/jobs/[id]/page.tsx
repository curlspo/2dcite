import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { FUNDS_HOLD_COPY } from "@2dcite/shared";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { formatUsd, serializeJob } from "@/lib/jobs";
import { PayJobButton } from "@/components/jobs/PayJobButton";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; cancelled?: string }>;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;

  const jobRow = await prisma.job.findUnique({
    where: { id },
    include: {
      payment: true,
      payout: true,
      certificate: true,
      student: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!jobRow) notFound();

  const allowed =
    user.role === "ADMIN" ||
    jobRow.clientId === user.id ||
    jobRow.studentId === user.id;
  if (!allowed) redirect("/dashboard");

  const job = serializeJob(jobRow, user);
  const isClient = jobRow.clientId === user.id;

  return (
    <AppShell user={user}>
      <Link href="/jobs" className="text-sm text-accent underline">
        ← All jobs
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
        {job.title}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Status: <strong className="text-ink">{job.status}</strong> ·{" "}
        {job.turnaroundTier} · {job.grossFeeDisplay}
      </p>

      {sp.paid === "1" && (
        <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
          Payment received. {FUNDS_HOLD_COPY.heldStatus} Matching will assign a
          student in Phase 3.
        </div>
      )}
      {sp.cancelled === "1" && (
        <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Checkout cancelled. You can pay when ready.
        </div>
      )}

      <dl className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Created</dt>
          <dd className="text-ink">{new Date(job.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted">PDF</dt>
          <dd className="truncate text-ink">{job.pdfFileName || job.pdfKey || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Payment</dt>
          <dd className="text-ink">
            {job.payment?.status || "—"}
            {job.payment?.paidAt
              ? ` · ${new Date(job.payment.paidAt).toLocaleString()}`
              : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Payout (student share)</dt>
          <dd className="text-ink">
            {job.payout
              ? `${job.payout.status} · ${formatUsd(job.payout.studentAmountCents)}`
              : "Not held yet (pay first)"}
          </dd>
        </div>
        {job.instructions && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Instructions</dt>
            <dd className="whitespace-pre-wrap text-ink">{job.instructions}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 rounded-lg border border-border bg-accent-soft/40 p-4 text-sm text-muted">
        <p>{FUNDS_HOLD_COPY.clientPayOnUpload}</p>
        <p className="mt-2">{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
      </div>

      {isClient && job.status === "AWAITING_PAYMENT" && (
        <div className="mt-6">
          <PayJobButton jobId={job.id} amountDisplay={job.grossFeeDisplay} />
        </div>
      )}

      {job.studentAssigned && (
        <p className="mt-4 text-sm text-muted">
          {job.student
            ? `Assigned to you (${job.status})`
            : `Independent student reviewer assigned (${job.status}) — identity withheld under blind matching.`}
        </p>
      )}

      {job.certificate && (
        <div className="mt-8 rounded-lg border border-gold/40 bg-accent-soft/50 p-5 text-sm">
          <p className="font-medium text-ink">Certificate of Citation Review</p>
          <p className="mt-1 text-muted">
            {job.certificate.certNumber} · issued{" "}
            {new Date(job.certificate.issuedAt).toLocaleString()}
          </p>
          {job.payout && (
            <p className="mt-2 text-muted">
              Student payout: <strong className="text-ink">{job.payout.status}</strong>
              {job.payout.releasedAt
                ? ` · ${new Date(job.payout.releasedAt).toLocaleString()}`
                : ""}
            </p>
          )}
          <a
            href={`/api/v1/jobs/${job.id}/certificate?download=1`}
            className="btn-primary mt-3"
            style={{ color: "#ffffff", backgroundColor: "#16325c" }}
          >
            Download certificate PDF
          </a>
          <p className="mt-2 text-xs text-muted">
            May be filed with the document or retained as evidence of best
            efforts. Liability remains with the licensed attorney or judge.
          </p>
        </div>
      )}

      {job.review && (
        <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm">
          <p className="font-medium text-ink">Review findings</p>
          <p className="mt-1 text-xs text-muted">
            Submitted {new Date(job.review.submittedAt).toLocaleString()} ·
            independent verification only — not legal advice
          </p>
          <pre className="mt-3 max-h-80 overflow-auto rounded bg-background p-3 text-xs text-muted">
            {JSON.stringify(job.review.findings, null, 2)}
          </pre>
          {job.review.overallNotes && (
            <p className="mt-3 whitespace-pre-wrap text-muted">
              {job.review.overallNotes}
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
