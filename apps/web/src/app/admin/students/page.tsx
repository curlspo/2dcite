import { redirect } from "next/navigation";
import { prisma } from "@2dcite/db";
import { getSessionUserFromCookies } from "@/lib/session";
import { AppShell } from "@/components/dashboard/AppShell";
import {
  StudentReviewList,
  type AdminStudentRow,
} from "@/components/admin/StudentReviewList";

export default async function AdminStudentsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const students = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows: AdminStudentRow[] = students.map((s) => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    lawSchool: s.lawSchool,
    year: s.year,
    status: s.status,
    professorName: s.professorName,
    professorEmail: s.professorEmail,
    applicationComplete: Boolean(
      s.lawSchool &&
        s.enrollmentProofKey &&
        s.legalWritingProofKey &&
        s.professorRecKey
    ),
    rejectionReason: s.rejectionReason,
  }));

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">
        Student verification
      </h1>
      <p className="mt-2 text-sm text-muted">
        Approve only complete applications that meet eligibility: enrolled 2L/3L,
        legal writing passed, professor recommendation, uploaded proof.
      </p>
      <div className="mt-8">
        <StudentReviewList initial={rows} />
      </div>
    </AppShell>
  );
}
