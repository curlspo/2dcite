import { redirect } from "next/navigation";
import {
  CONFIDENTIALITY_CORE,
  STUDENT_CREDENTIAL_REVIEW_HOURS,
  STUDENT_CREDENTIAL_TURNAROUND_COPY,
} from "@2dcite/shared";
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
        Student eligibility & credentials
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {STUDENT_CREDENTIAL_TURNAROUND_COPY} Only{" "}
        <strong className="font-medium text-ink">APPROVED</strong> students can
        receive assignments (one at a time). Typical turnaround: up to{" "}
        {STUDENT_CREDENTIAL_REVIEW_HOURS} hours after a complete application.
      </p>
      <div
        className="mt-4 max-w-2xl rounded-lg border border-border bg-accent-soft/50 p-4 text-sm text-muted"
        role="note"
      >
        <p className="font-medium text-ink">Confidentiality obligations</p>
        <p className="mt-2">{CONFIDENTIALITY_CORE.studentConfidentiality}</p>
        <p className="mt-2">
          {CONFIDENTIALITY_CORE.noDisclosureOfFailedCitations}
        </p>
        <p className="mt-2">{CONFIDENTIALITY_CORE.findingsOnlyToClient}</p>
      </div>
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
