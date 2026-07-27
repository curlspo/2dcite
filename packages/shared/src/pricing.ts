/**
 * MVP pricing defaults (cents). Adjust via env/config later without schema changes.
 */

export const PRICING_DEFAULTS = {
  /** Base fixed fee charged to client (USD cents) — Standard */
  baseFeeCents: 7900, // $79.00
  /** Rush surcharge added to base (USD cents) — Standard + surcharge = $119 */
  rushFeeCents: 4000, // $40.00 surcharge → $119.00 total
  /** Platform share of total fee, basis points (e.g. 2500 = 25%) */
  platformFeeBps: 2500,
  /** Soft page cap for MVP single tier */
  maxPages: 25,
  /** Standard SLA hours after student accept */
  standardSlaHours: 48,
  /** Rush SLA hours after student accept */
  rushSlaHours: 24,
  /** Minutes for student to accept before reassign */
  assignmentAcceptMinutes: 60,
} as const;

/** Monthly membership for attorneys & judges */
export const MEMBERSHIP = {
  /** Monthly subscription price (USD cents) */
  monthlyCents: 9900, // $99.00
  /** Included citation reviews per billing period (Standard or Rush) */
  includedReviewsPerMonth: 1,
  /**
   * Discount on additional reviews beyond the included allotment.
   * 1000 bps = 10% off list price.
   */
  additionalReviewDiscountBps: 1000,
  /** Product label for checkout / marketing */
  name: "2dcite Membership",
  tagline: "1 citation check per month · 10% off additional reviews",
} as const;

export type PricingMode =
  | "LIST"
  | "MEMBERSHIP_INCLUDED"
  | "MEMBERSHIP_DISCOUNT";

export function computeFeeBreakdown(opts: {
  isRush: boolean;
  baseFeeCents?: number;
  rushFeeCents?: number;
  platformFeeBps?: number;
}) {
  const base = opts.baseFeeCents ?? PRICING_DEFAULTS.baseFeeCents;
  const rush =
    opts.isRush ? (opts.rushFeeCents ?? PRICING_DEFAULTS.rushFeeCents) : 0;
  const grossCents = base + rush;
  const bps = opts.platformFeeBps ?? PRICING_DEFAULTS.platformFeeBps;
  const platformFeeCents = Math.round((grossCents * bps) / 10000);
  const studentAmountCents = grossCents - platformFeeCents;
  return {
    baseFeeCents: base,
    rushFeeCents: rush,
    grossCents,
    platformFeeCents,
    studentAmountCents,
  };
}

/**
 * Client-facing job price with optional membership benefits.
 * Student share always uses the list (non-discounted) student amount so
 * reviewers are not underpaid; the platform absorbs free/discount cost.
 */
export function computeClientJobPricing(opts: {
  isRush: boolean;
  isActiveMember: boolean;
  /** Reviews still available in the current membership period */
  includedReviewsRemaining: number;
}) {
  const list = computeFeeBreakdown({ isRush: opts.isRush });

  if (!opts.isActiveMember) {
    return {
      mode: "LIST" as const satisfies PricingMode,
      baseFeeCents: list.baseFeeCents,
      rushFeeCents: list.rushFeeCents,
      listGrossCents: list.grossCents,
      /** Amount the client pays */
      grossCents: list.grossCents,
      platformFeeCents: list.platformFeeCents,
      studentAmountCents: list.studentAmountCents,
      discountCents: 0,
    };
  }

  if (opts.includedReviewsRemaining > 0) {
    return {
      mode: "MEMBERSHIP_INCLUDED" as const satisfies PricingMode,
      baseFeeCents: list.baseFeeCents,
      rushFeeCents: list.rushFeeCents,
      listGrossCents: list.grossCents,
      grossCents: 0,
      // Platform subsidy: client pays $0; student still earns list student share
      platformFeeCents: -list.studentAmountCents,
      studentAmountCents: list.studentAmountCents,
      discountCents: list.grossCents,
    };
  }

  const discountBps = MEMBERSHIP.additionalReviewDiscountBps;
  const discountCents = Math.round((list.grossCents * discountBps) / 10000);
  const clientPay = list.grossCents - discountCents;

  return {
    mode: "MEMBERSHIP_DISCOUNT" as const satisfies PricingMode,
    baseFeeCents: list.baseFeeCents,
    rushFeeCents: list.rushFeeCents,
    listGrossCents: list.grossCents,
    grossCents: clientPay,
    platformFeeCents: clientPay - list.studentAmountCents,
    studentAmountCents: list.studentAmountCents,
    discountCents,
  };
}
