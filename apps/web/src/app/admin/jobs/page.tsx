import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { JobOpsList, type AdminJobRow } from "@/components/admin/JobOpsList";
import { formatUsd } from "@/lib/jobs";

export default async function AdminJobsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: { select: { name: true } },
      student: { select: { name: true } },
      payout: true,
    },
  });

  const rows: AdminJobRow[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    turnaroundTier: j.turnaroundTier,
    clientName: j.client.name,
    studentName: j.student?.name ?? null,
    grossFeeDisplay: formatUsd(j.grossFeeCents),
    payoutStatus: j.payout?.status ?? null,
    createdAt: j.createdAt.toISOString(),
  }));

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">Jobs</h1>
      <p className="mt-1 text-sm text-muted">
        Reassign stuck work (returns job to queue and tries another student).
        Does not refund client payment.
      </p>
      <div className="mt-8">
        <JobOpsList initial={rows} />
      </div>
    </AppShell>
  );
}
