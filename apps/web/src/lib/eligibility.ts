import type { SessionUser } from "./session";

/** Student may receive jobs only when approved and has no active assignment (checked at match time). */
export function isStudentEligibleForMatching(user: SessionUser): boolean {
  if (user.role !== "STUDENT") return false;
  return user.studentProfile?.status === "APPROVED";
}

export function studentGateMessage(user: SessionUser): string | null {
  if (user.role !== "STUDENT") return null;
  const status = user.studentProfile?.status;
  if (!user.studentProfile) {
    return "Complete your eligibility application before receiving assignments.";
  }
  if (status === "PENDING") {
    return "Your application is pending admin review. You cannot receive assignments yet.";
  }
  if (status === "REJECTED") {
    return (
      user.studentProfile.rejectionReason ||
      "Your application was not approved. Contact support if you believe this is an error."
    );
  }
  return null;
}
