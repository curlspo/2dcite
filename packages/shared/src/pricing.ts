/**
 * MVP pricing defaults (cents). Adjust via env/config later without schema changes.
 * Open items from product plan: exact amounts, platform %, rush surcharge, page cap.
 */

export const PRICING_DEFAULTS = {
  /** Base fixed fee charged to client (USD cents) */
  baseFeeCents: 14900, // $149.00 placeholder
  /** Rush surcharge added to base (USD cents) */
  rushFeeCents: 7500, // $75.00 placeholder
  /** Platform share of total fee, basis points (e.g. 2500 = 25%) */
  platformFeeBps: 2500,
  /** Soft page cap for MVP single tier */
  maxPages: 25,
  /** Standard SLA hours after student accept */
  standardSlaHours: 48,
  /** Rush SLA hours after student accept (placeholder) */
  rushSlaHours: 24,
  /** Minutes for student to accept before reassign */
  assignmentAcceptMinutes: 60,
} as const;

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
