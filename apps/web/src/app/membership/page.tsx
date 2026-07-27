import Link from "next/link";
import { redirect } from "next/navigation";
import { MEMBERSHIP, PRICING_DEFAULTS } from "@2dcite/shared";
import { getSessionUserFromCookies } from "@/lib/session";
import {
  getMembershipForUser,
  membershipSummary,
} from "@/lib/membership";
import { formatUsd } from "@/lib/jobs";
import { AppShell } from "@/components/dashboard/AppShell";
import { MembershipCheckoutButton } from "@/components/membership/MembershipCheckoutButton";

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?next=/membership");
  if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const m = await getMembershipForUser(user.id);
  const summary = membershipSummary(m);

  return (
    <AppShell user={user}>
      <h1 className="font-serif text-2xl font-semibold text-ink">Membership</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {MEMBERSHIP.tagline}. Billed monthly. Independent verification only—not
        legal advice. Liability remains with you.
      </p>

      {params.success === "1" && (
        <div
          className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
          role="status"
        >
          Membership checkout completed. If your benefits are not active yet,
          wait a moment and refresh—Stripe may still be confirming the
          subscription.
        </div>
      )}
      {params.cancelled === "1" && (
        <div
          className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted"
          role="status"
        >
          Checkout cancelled. No membership charge was made.
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-accent bg-accent-soft/40 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink">
            {MEMBERSHIP.name}
          </p>
          <p className="mt-2 font-serif text-3xl font-semibold text-ink">
            {formatUsd(MEMBERSHIP.monthlyCents)}
            <span className="ml-1 text-base font-sans font-normal text-muted">
              / month
            </span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li>
              {MEMBERSHIP.includedReviewsPerMonth} citation check included each
              billing period (Standard or Rush)
            </li>
            <li>
              {MEMBERSHIP.additionalReviewDiscountBps / 100}% off additional
              reviews
            </li>
            <li>Same Certificate of Citation Review workflow</li>
            <li>Cancel anytime by contacting support</li>
          </ul>

          {summary.isActive ? (
            <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium text-ink">Active membership</p>
              <p className="mt-2 text-muted">
                Included reviews this period:{" "}
                <strong className="text-ink">
                  {summary.includedReviewsUsed} /{" "}
                  {summary.includedReviewsPerMonth}
                </strong>{" "}
                used
                {summary.includedReviewsRemaining > 0
                  ? ` · ${summary.includedReviewsRemaining} remaining`
                  : " · next reviews at 10% off"}
              </p>
              {summary.currentPeriodEnd && (
                <p className="mt-1 text-muted">
                  Current period ends{" "}
                  {new Date(summary.currentPeriodEnd).toLocaleDateString(
                    "en-US",
                    { dateStyle: "medium" }
                  )}
                  {summary.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
                </p>
              )}
              <Link
                href="/jobs/new"
                className="btn-primary mt-4 inline-flex"
                style={{ color: "#ffffff", backgroundColor: "#16325c" }}
              >
                Start a review
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <MembershipCheckoutButton />
              <p className="mt-3 text-xs text-muted">
                Status: {summary.status === "NONE" ? "Not subscribed" : summary.status}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
          <p className="font-medium text-ink">How membership works</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Subscribe for {formatUsd(MEMBERSHIP.monthlyCents)}/month.</li>
            <li>
              Your first review each period is included at no additional charge.
            </li>
            <li>
              Further reviews in that period are automatically discounted by{" "}
              {MEMBERSHIP.additionalReviewDiscountBps / 100}%.
            </li>
            <li>
              Student reviewers still receive their full share; the platform
              absorbs the membership benefit.
            </li>
          </ol>
          <p className="mt-6">
            Prefer pay-as-you-go?{" "}
            <Link href="/jobs/new" className="text-accent underline">
              Submit a single review
            </Link>{" "}
            at standard rates (
            {formatUsd(PRICING_DEFAULTS.baseFeeCents)} Standard /{" "}
            {formatUsd(
              PRICING_DEFAULTS.baseFeeCents + PRICING_DEFAULTS.rushFeeCents
            )}{" "}
            Rush).
          </p>
        </div>
      </div>
    </AppShell>
  );
}
