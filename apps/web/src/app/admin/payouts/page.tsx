import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { formatUsd } from "@/lib/jobs";

export default async function AdminPayoutsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const payouts = await prisma.payout.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      job: { select: { id: true, title: true, status: true } },
    },
  });

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">Payouts</h1>
      <p className="mt-1 text-sm text-muted">
        Client funds are held until certificate issuance.{" "}
        <strong className="font-medium text-ink">HELD</strong> = waiting for
        cert; <strong className="font-medium text-ink">RELEASED</strong> = student
        share marked payable (Stripe Connect bank transfer is post-MVP).
      </p>
      {payouts.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No payouts yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-card text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Student share</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Held</th>
                <th className="px-3 py-2">Released</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-ink">{p.job.title}</p>
                    <p className="text-xs text-muted">{p.job.status}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        p.status === "HELD"
                          ? "text-gold"
                          : p.status === "RELEASED"
                            ? "text-green-800"
                            : "text-muted"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {formatUsd(p.studentAmountCents)}
                  </td>
                  <td className="px-3 py-2">
                    {formatUsd(p.platformFeeCents)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {new Date(p.heldAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {p.releasedAt
                      ? new Date(p.releasedAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
