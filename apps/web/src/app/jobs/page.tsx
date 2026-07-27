import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { formatUsd, serializeJob } from "@/lib/jobs";

export default async function JobsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/dashboard");

  const jobs = await prisma.job.findMany({
    where: user.role === "ADMIN" ? undefined : { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      payment: true,
      payout: true,
      certificate: true,
      student: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Citation review jobs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Payment is held by 2dcite until a Certificate of Citation Review is
            issued.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="btn-primary"
          style={{ color: "#ffffff", backgroundColor: "#16325c" }}
        >
          New review
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No jobs yet.{" "}
          <Link href="/jobs/new" className="text-accent underline">
            Submit a document
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
          {jobs.map((j) => {
            const job = serializeJob(j);
            return (
              <li key={j.id}>
                <Link
                  href={`/jobs/${j.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-accent-soft/40"
                >
                  <div>
                    <p className="font-medium text-ink">{job.title}</p>
                    <p className="text-xs text-muted">
                      {job.status} · {job.turnaroundTier} ·{" "}
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-ink">{formatUsd(job.grossFeeCents)}</p>
                    {job.payout && (
                      <p className="text-xs text-muted">
                        payout {job.payout.status}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
