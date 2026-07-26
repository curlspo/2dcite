import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import { StudentApplicationForm } from "@/components/student/StudentApplicationForm";

export default async function StudentOnboardingPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/dashboard");

  const p = user.studentProfile;

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">
        Student eligibility
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        You must be a currently enrolled 2L or 3L at an accredited law school,
        have passed a legal writing course, and be recommended by a professor.
        Applications are reviewed manually by 2dcite admin. Only{" "}
        <strong className="font-medium text-ink">APPROVED</strong> students can
        receive assignments (one at a time).
      </p>
      <StudentApplicationForm
        initial={{
          lawSchool: p?.lawSchool,
          year: p?.year,
          professorName: p?.professorName,
          professorEmail: p?.professorEmail,
          status: p?.status,
          rejectionReason: p?.rejectionReason,
        }}
      />
    </AppShell>
  );
}
