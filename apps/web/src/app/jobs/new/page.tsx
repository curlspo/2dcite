import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { NewJobForm } from "@/components/jobs/NewJobForm";

export default async function NewJobPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
    redirect("/dashboard");
  }

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">
        New citation review
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Upload a PDF, choose turnaround, accept liability acknowledgments, and
        pay. Funds are held by the platform until the Certificate is generated.
      </p>
      <NewJobForm />
    </AppShell>
  );
}
