import { redirect } from "next/navigation";
import { getSessionContextFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { AdminMfaPanel } from "@/components/admin/AdminMfaPanel";

export default async function AdminMfaPage() {
  const ctx = await getSessionContextFromCookies();
  if (!ctx) redirect("/login");
  if (ctx.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell user={ctx.user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">
        Admin multi-factor authentication
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        TOTP MFA is required for admin accounts. Sensitive actions (approve /
        reject students, reassign jobs) also require a recent step-up
        verification.
      </p>
      <AdminMfaPanel
        mfaEnabled={ctx.user.mfaEnabled}
        mfaVerified={Boolean(ctx.session.mfaVerifiedAt)}
      />
    </AppShell>
  );
}
