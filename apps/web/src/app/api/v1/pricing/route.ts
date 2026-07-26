import {
  PRICING_DEFAULTS,
  computeFeeBreakdown,
  FUNDS_HOLD_COPY,
  CLIENT_SUBMIT_ACKNOWLEDGMENTS,
  DISCLAIMER_COPY_VERSION,
} from "@2dcite/shared";
import { formatUsd } from "@/lib/jobs";
import { jsonOk } from "@/lib/http";
import { stripeEnabled } from "@/lib/payments";

export async function GET() {
  const standard = computeFeeBreakdown({ isRush: false });
  const rush = computeFeeBreakdown({ isRush: true });

  return jsonOk({
    currency: "USD",
    maxPages: PRICING_DEFAULTS.maxPages,
    standardSlaHours: PRICING_DEFAULTS.standardSlaHours,
    rushSlaHours: PRICING_DEFAULTS.rushSlaHours,
    platformFeeBps: PRICING_DEFAULTS.platformFeeBps,
    fundsHold: FUNDS_HOLD_COPY,
    disclaimerCopyVersion: DISCLAIMER_COPY_VERSION,
    acknowledgments: CLIENT_SUBMIT_ACKNOWLEDGMENTS,
    stripeEnabled: stripeEnabled(),
    tiers: {
      STANDARD_48H: {
        ...standard,
        display: formatUsd(standard.grossCents),
        label: `Standard (${PRICING_DEFAULTS.standardSlaHours}h)`,
      },
      RUSH: {
        ...rush,
        display: formatUsd(rush.grossCents),
        label: `Rush (${PRICING_DEFAULTS.rushSlaHours}h)`,
      },
    },
  });
}
