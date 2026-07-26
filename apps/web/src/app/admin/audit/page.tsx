import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AdminAuditPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { name: true, email: true, role: true } },
    },
  });

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">Audit log</h1>
      <p className="mt-1 text-sm text-muted">
        Recent platform actions (auth, payments, matching, certificates).
      </p>
      {logs.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No audit events yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
          {logs.map((l) => (
            <li key={l.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium text-ink">{l.action}</p>
                <p className="text-xs text-muted">
                  {new Date(l.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-muted">
                {l.entityType}
                {l.entityId ? ` · ${l.entityId}` : ""}
                {l.actor
                  ? ` · ${l.actor.name} (${l.actor.role})`
                  : " · system"}
              </p>
              {l.metadata != null && (
                <pre className="mt-1 max-h-24 overflow-auto text-xs text-muted">
                  {JSON.stringify(l.metadata)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
