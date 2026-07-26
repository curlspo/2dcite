import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { formatUsd } from "@/lib/jobs";

export default async function AdminHomePage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [
    pendingStudents,
    queuedJobs,
    assignedJobs,
    heldPayouts,
    releasedPayouts,
    certifiedJobs,
  ] = await Promise.all([
    prisma.studentProfile.count({ where: { status: "PENDING" } }),
    prisma.job.count({ where: { status: "QUEUED" } }),
    prisma.job.count({ where: { status: { in: ["ASSIGNED", "IN_REVIEW"] } } }),
    prisma.payout.count({ where: { status: "HELD" } }),
    prisma.payout.count({ where: { status: "RELEASED" } }),
    prisma.job.count({ where: { status: "CERTIFIED" } }),
  ]);

  const heldSum = await prisma.payout.aggregate({
    where: { status: "HELD" },
    _sum: { studentAmountCents: true },
  });

  const cards = [
    {
      href: "/admin/students",
      label: "Pending students",
      value: String(pendingStudents),
    },
    { href: "/admin/jobs", label: "Queued jobs", value: String(queuedJobs) },
    {
      href: "/admin/jobs",
      label: "Active assignments",
      value: String(assignedJobs),
    },
    {
      href: "/admin/payouts",
      label: "Held student shares",
      value: `${heldPayouts} · ${formatUsd(heldSum._sum.studentAmountCents || 0)}`,
    },
    {
      href: "/admin/payouts",
      label: "Released payouts",
      value: String(releasedPayouts),
    },
    {
      href: "/admin/jobs",
      label: "Certificates issued",
      value: String(certifiedJobs),
    },
  ];

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">Admin</h1>
      <p className="mt-1 text-sm text-muted">
        Operations dashboard for eligibility, jobs, and held funds.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-border bg-card p-5 hover:border-accent"
          >
            <p className="text-xs uppercase tracking-wide text-gold">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/students" className="text-accent underline">
          Student verification
        </Link>
        <Link href="/admin/jobs" className="text-accent underline">
          Jobs & reassign
        </Link>
        <Link href="/admin/payouts" className="text-accent underline">
          Payouts
        </Link>
        <Link href="/admin/audit" className="text-accent underline">
          Audit log
        </Link>
      </div>
    </AppShell>
  );
}
