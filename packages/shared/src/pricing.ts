/**
 * MVP pricing defaults (cents). Adjust via env/config later without schema changes.
 * Open items from product plan: exact amounts, platform %, rush surcharge, page cap.
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
