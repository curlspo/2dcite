import {
  CLIENT_SUBMIT_ACKNOWLEDGMENTS,
  DISCLAIMER_COPY_VERSION,
  computeFeeBreakdown,
  type TurnaroundTier,
} from "@2dcite/shared";
import type {
  Job,
  Payment,
  Payout,
  Certificate,
  Review,
  User,
  PricingMode,
  UserRole,
} from "@2dcite/db";

export function requiredAckIds(): string[] {
  return CLIENT_SUBMIT_ACKNOWLEDGMENTS.map((a) => a.id);
}

export function validateClientAcknowledgments(input: {
  copyVersion: string;
  acceptedIds: string[];
}): { ok: true } | { ok: false; error: string } {
  if (input.copyVersion !== DISCLAIMER_COPY_VERSION) {
    return {
      ok: false,
      error: `Disclaimer copy version mismatch. Expected ${DISCLAIMER_COPY_VERSION}. Refresh and re-acknowledge.`,
    };
  }
  const required = requiredAckIds();
  const set = new Set(input.acceptedIds);
  for (const id of required) {
    if (!set.has(id)) {
      return { ok: false, error: `Missing required acknowledgment: ${id}` };
    }
  }
  return { ok: true };
}

export function feeForTier(tier: TurnaroundTier) {
  const isRush = tier === "RUSH";
  return computeFeeBreakdown({ isRush });
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export type JobWithRelations = Job & {
  payment?: Payment | null;
  payout?: Payout | null;
  certificate?: Certificate | null;
  review?: Review | null;
  student?: Pick<User, "id" | "name"> | null;
  client?: Pick<User, "id" | "name" | "email" | "role"> | null;
  pricingMode?: PricingMode;
  listGrossCents?: number | null;
};

export type SerializeViewer = {
  id: string;
  role: UserRole | string;
};

/**
 * Serialize a job for API/UI.
 * Blind matching: attorneys/judges never receive student id or name.
 * Admins and the assigned student may see identity.
 */
export function serializeJob(
  job: JobWithRelations,
  viewer?: SerializeViewer | null
) {
  const role = viewer?.role;
  const isAdmin = role === "ADMIN";
  const isAssignedStudent =
    role === "STUDENT" && viewer?.id != null && viewer.id === job.studentId;
  const revealStudentIdentity = isAdmin || isAssignedStudent;

  return {
    id: job.id,
    title: job.title,
    instructions: job.instructions,
    status: job.status,
    turnaroundTier: job.turnaroundTier,
    /** Existence-only vs proposition-support (client-selected) */
    reviewScope:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (job as any).reviewScope ?? "EXISTENCE_ONLY",
    /**
     * Anonymous reviewer number for attorneys/judges (and everyone).
     * Real student identity is never shown to clients.
     */
    reviewerCode:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (job as any).reviewerCode ?? null,
    pdfKey: job.pdfKey,
    pdfFileName: job.pdfFileName,
    baseFeeCents: job.baseFeeCents,
    rushFeeCents: job.rushFeeCents,
    grossFeeCents: job.grossFeeCents,
    platformFeeCents: job.platformFeeCents,
    studentFeeCents: job.studentFeeCents,
    listGrossCents: job.listGrossCents ?? job.grossFeeCents,
    pricingMode: job.pricingMode ?? "LIST",
    grossFeeDisplay: formatUsd(job.grossFeeCents),
    listGrossDisplay: formatUsd(job.listGrossCents ?? job.grossFeeCents),
    dueAt: job.dueAt,
    assignedAt: job.assignedAt,
    acceptedAt: job.acceptedAt,
    completedAt: job.completedAt,
    certifiedAt: job.certifiedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    clientId: job.clientId,
    /** True when a student is assigned; identity redacted for clients */
    studentAssigned: Boolean(job.studentId),
    studentId: revealStudentIdentity ? job.studentId : null,
    student: revealStudentIdentity
      ? job.student
        ? { id: job.student.id, name: job.student.name }
        : null
      : null,
    client: job.client
      ? {
          id: job.client.id,
          name: job.client.name,
          email: job.client.email,
          role: job.client.role,
        }
      : null,
    payment: job.payment
      ? {
          id: job.payment.id,
          amountCents: job.payment.amountCents,
          status: job.payment.status,
          paidAt: job.payment.paidAt,
        }
      : null,
    payout: job.payout
      ? {
          id: job.payout.id,
          status: job.payout.status,
          studentAmountCents: job.payout.studentAmountCents,
          platformFeeCents: job.payout.platformFeeCents,
          heldAt: job.payout.heldAt,
          releasedAt: job.payout.releasedAt,
        }
      : null,
    certificate: job.certificate
      ? {
          id: job.certificate.id,
          certNumber: job.certificate.certNumber,
          issuedAt: job.certificate.issuedAt,
        }
      : null,
    review: job.review
      ? {
          id: job.review.id,
          findings: job.review.findings,
          overallNotes: job.review.overallNotes,
          submittedAt: job.review.submittedAt,
          attestationAt: job.review.attestationAt,
        }
      : null,
  };
}
