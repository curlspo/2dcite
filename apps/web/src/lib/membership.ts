import "server-only";
import {
  prisma,
  enterBypassRls,
  type Membership,
  type MembershipStatus,
} from "@2dcite/db";
import {
  MEMBERSHIP,
  computeClientJobPricing,
  type PricingMode,
} from "@2dcite/shared";

export type MembershipSummary = {
  status: MembershipStatus | "NONE";
  isActive: boolean;
  monthlyCents: number;
  includedReviewsPerMonth: number;
  includedReviewsUsed: number;
  includedReviewsRemaining: number;
  additionalReviewDiscountBps: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function isMembershipActive(
  m: Pick<Membership, "status" | "currentPeriodEnd"> | null | undefined
): boolean {
  if (!m) return false;
  if (m.status !== "ACTIVE" && m.status !== "PAST_DUE") return false;
  // PAST_DUE still gets benefits briefly until Stripe cancels; ACTIVE is primary
  if (m.status === "ACTIVE") return true;
  // Soft grace: PAST_DUE still counts as active for benefits this period
  return m.status === "PAST_DUE";
}

export function membershipSummary(
  m: Membership | null | undefined
): MembershipSummary {
  const active = isMembershipActive(m);
  const used = m?.includedReviewsUsed ?? 0;
  const cap = MEMBERSHIP.includedReviewsPerMonth;
  const remaining = active ? Math.max(0, cap - used) : 0;

  return {
    status: m?.status ?? "NONE",
    isActive: active,
    monthlyCents: MEMBERSHIP.monthlyCents,
    includedReviewsPerMonth: cap,
    includedReviewsUsed: used,
    includedReviewsRemaining: remaining,
    additionalReviewDiscountBps: MEMBERSHIP.additionalReviewDiscountBps,
    currentPeriodEnd: m?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: m?.cancelAtPeriodEnd ?? false,
  };
}

export async function getMembershipForUser(userId: string) {
  // System-safe read (webhook + checkout). App layer always scopes userId.
  return enterBypassRls(() =>
    prisma.membership.findUnique({ where: { userId } })
  );
}

export async function resolveJobPricingForUser(
  userId: string,
  isRush: boolean
) {
  const m = await getMembershipForUser(userId);
  const summary = membershipSummary(m);
  const pricing = computeClientJobPricing({
    isRush,
    isActiveMember: summary.isActive,
    includedReviewsRemaining: summary.includedReviewsRemaining,
  });
  return { membership: m, summary, pricing };
}

/** Map shared PricingMode string to Prisma enum */
export function toPrismaPricingMode(mode: PricingMode): PricingMode {
  return mode;
}

/**
 * After a membership-included job is paid, increment includedReviewsUsed.
 * Idempotent per job via audit check is caller's responsibility; we only
 * increment when mode is MEMBERSHIP_INCLUDED.
 */
export async function consumeIncludedReview(userId: string) {
  return enterBypassRls(async () => {
    const m = await prisma.membership.findUnique({ where: { userId } });
    if (!m || !isMembershipActive(m)) return m;
    if (m.includedReviewsUsed >= MEMBERSHIP.includedReviewsPerMonth) return m;

    return prisma.membership.update({
      where: { id: m.id },
      data: { includedReviewsUsed: { increment: 1 } },
    });
  });
}

export async function upsertMembershipFromStripe(opts: {
  userId: string;
  status: MembershipStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  /** When true, reset included reviews (new billing period) */
  resetIncludedUsage?: boolean;
}) {
  return enterBypassRls(async () => {
  const existing = await prisma.membership.findUnique({
    where: { userId: opts.userId },
  });

  const data = {
    status: opts.status,
    stripeCustomerId:
      opts.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    stripeSubscriptionId:
      opts.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
    currentPeriodStart:
      opts.currentPeriodStart ?? existing?.currentPeriodStart ?? null,
    currentPeriodEnd:
      opts.currentPeriodEnd ?? existing?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd:
      opts.cancelAtPeriodEnd ?? existing?.cancelAtPeriodEnd ?? false,
    ...(opts.resetIncludedUsage ? { includedReviewsUsed: 0 } : {}),
  };

  if (existing) {
    return prisma.membership.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.membership.create({
    data: {
      userId: opts.userId,
      ...data,
      includedReviewsUsed: 0,
    },
  });
  });
}

export function stripeSubStatusToMembership(
  status: string
): MembershipStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}
