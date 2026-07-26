import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserFromCookies } from "@/lib/session";
import { studentGateMessage } from "@/lib/eligibility";
import { AppShell } from "@/components/dashboard/AppShell";
import { FUNDS_HOLD_COPY } from "@2dcite/shared";

export default async function DashboardPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin/students");

  const gate = studentGateMessage(user);

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">
        Welcome, {user.name}
      </h1>
      <p className="mt-2 text-muted">
        {user.role === "STUDENT"
          ? "Student home — assignments appear here after you are approved."
          : "Client home — job submission ships in Phase 2 (pay on upload, funds held until certificate)."}
      </p>

      {user.role === "STUDENT" && gate && (
        <div className="mt-6 rounded-lg border border-border bg-accent-soft p-4 text-sm text-ink">
          <p className="font-medium">Eligibility gate</p>
          <p className="mt-1 text-muted">{gate}</p>
          <Link
            href="/onboarding/student"
            className="mt-3 inline-block text-accent underline"
          >
            Complete or view application →
          </Link>
        </div>
      )}

      {user.role === "STUDENT" && user.studentProfile?.status === "APPROVED" && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          You are approved and eligible for matching (one active assignment at a
          time). Assignment queue arrives in Phase 3.
        </div>
      )}

      {(user.role === "ATTORNEY" || user.role === "JUDGE") && (
        <div className="mt-6 space-y-3 rounded-lg border border-border bg-card p-5 text-sm text-muted">
          <p className="font-medium text-ink">Submit a citation review</p>
          <p>
            Upload a PDF, choose Standard or Rush, accept liability
            acknowledgments, and pay. {FUNDS_HOLD_COPY.clientPayOnUpload}
          </p>
          <p>{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
          <Link
            href="/jobs/new"
            className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            New citation review
          </Link>
          <Link href="/jobs" className="ml-3 text-sm text-accent underline">
            View jobs
          </Link>
        </div>
      )}
    </AppShell>
  );
}
