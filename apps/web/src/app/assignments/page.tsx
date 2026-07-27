import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { studentGateMessage } from "@/lib/eligibility";
import { AppShell } from "@/components/dashboard/AppShell";
import { serializeJob } from "@/lib/jobs";
import { reassignTimedOutAssignments } from "@/lib/matching";
import { AssignmentActions } from "@/components/student/AssignmentActions";

export default async function AssignmentsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/dashboard");

  await reassignTimedOutAssignments();

  const gate = studentGateMessage(user);
  const jobs = await prisma.job.findMany({
    where: { studentId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      payment: true,
      payout: true,
      certificate: true,
      review: true,
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const active = jobs.filter((j) =>
    ["ASSIGNED", "IN_REVIEW"].includes(j.status)
  );

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">Assignments</h1>
      <p className="mt-1 text-sm text-muted">
        One active assignment at a time. Accept promptly or the job requeues.
      </p>

      {gate && (
        <div className="mt-6 rounded-lg border border-border bg-accent-soft p-4 text-sm">
          <p className="font-medium text-ink">Not eligible for matching</p>
          <p className="mt-1 text-muted">{gate}</p>
          <Link href="/onboarding/student" className="mt-2 inline-block text-accent underline">
            Eligibility application →
          </Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
          Active
        </h2>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No active assignment. When a paid job is queued and you are free, it
            will be auto-assigned here.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {active.map((j) => {
              const job = serializeJob(j, user);
              return (
                <li
                  key={j.id}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink">{job.title}</p>
                      <p className="text-xs text-muted">
                        {job.status} · {job.turnaroundTier}
                        {job.dueAt
                          ? ` · due ${new Date(job.dueAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/assignments/${j.id}`}
                      className="text-sm text-accent underline"
                    >
                      Open →
                    </Link>
                  </div>
                  <AssignmentActions jobId={j.id} status={j.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
          History
        </h2>
        {jobs.filter((j) => !["ASSIGNED", "IN_REVIEW"].includes(j.status))
          .length === 0 ? (
          <p className="mt-3 text-sm text-muted">No completed assignments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {jobs
              .filter((j) => !["ASSIGNED", "IN_REVIEW"].includes(j.status))
              .map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/assignments/${j.id}`}
                    className="flex justify-between px-4 py-3 text-sm hover:bg-accent-soft/40"
                  >
                    <span className="text-ink">{j.title}</span>
                    <span className="text-muted">{j.status}</span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
