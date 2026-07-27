import type { Metadata } from "next";
import Link from "next/link";
import {
  FUNDS_HOLD_COPY,
  MEMBERSHIP,
  PRICING_DEFAULTS,
  SUPPORT_EMAIL,
  computeFeeBreakdown,
} from "@2dcite/shared";
import { LiabilityFooter } from "@/components/legal/LiabilityFooter";
import { BrandLockup } from "@/components/marketing/BrandMark";
import { EligibilityChecklist } from "@/components/marketing/EligibilityChecklist";
import {
  HomeCertificate,
  HomeClosingCta,
  HomeHero,
  HomeHowItWorks,
  HomeHumanLoop,
  HomeResources,
  HomeTrustBar,
  HomeWhyItMatters,
} from "@/components/marketing/HomeSections";
import { PricingCards } from "@/components/marketing/PricingCards";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Independent citation verification for the bar and the bench",
  description:
    "2dcite connects attorneys and judges with qualified law students who independently check legal citations against their sources—and document the review with a Certificate of Citation Review.",
  openGraph: {
    title: "2dcite — Independent citation verification",
    description:
      "Human-in-the-loop citation review. Not legal advice. Liability remains with the licensed attorney or judge.",
    url: "https://2dcite.com/",
    type: "website",
  },
  alternates: {
    canonical: "https://2dcite.com/",
  },
};

export default function HomePage() {
  const standard = computeFeeBreakdown({ isRush: false });
  const rush = computeFeeBreakdown({ isRush: true });

  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      <SiteHeader />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <HomeHero />
        <HomeTrustBar />
        <HomeHumanLoop />
        <HomeWhyItMatters />
        <HomeHowItWorks />

        <section
          id="pricing"
          className="border-t border-border py-16"
          aria-labelledby="pricing-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="pricing-heading"
              className="font-serif text-2xl font-semibold text-ink md:text-3xl"
            >
              Simple fixed pricing
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              Transparent per-job fees, or a monthly membership for regular
              filers. Recommended max {PRICING_DEFAULTS.maxPages} pages per
              review for MVP.
            </p>
            <PricingCards
              tiers={[
                {
                  name: "Standard",
                  priceCents: standard.grossCents,
                  priceSuffix: "per review",
                  turnaround: `${PRICING_DEFAULTS.standardSlaHours} hours after student accepts`,
                  includes: [
                    "Independent citation verification",
                    "Full PDF or table of authorities",
                    "Certificate of Citation Review",
                  ],
                  cta: { label: "Get started", href: "/signup" },
                },
                {
                  name: "Rush",
                  priceCents: rush.grossCents,
                  priceSuffix: "per review",
                  turnaround: `${PRICING_DEFAULTS.rushSlaHours} hours after accept · priority matching`,
                  includes: [
                    "Everything in Standard",
                    "Faster turnaround after accept",
                    "Priority place in the matching queue",
                  ],
                  badge: "Faster",
                  cta: { label: "Get started", href: "/signup" },
                },
                {
                  name: "Membership",
                  priceCents: MEMBERSHIP.monthlyCents,
                  priceSuffix: "/ month",
                  turnaround: MEMBERSHIP.tagline,
                  includes: [
                    "1 citation check included each month (Standard or Rush)",
                    "10% off every additional review",
                    "Cancel anytime via support",
                    "Same independent student review & certificate",
                  ],
                  badge: "Best value",
                  highlighted: true,
                  cta: {
                    label: "Start membership",
                    href: "/signup?plan=membership",
                  },
                },
              ]}
            />
            <div className="mt-10 rounded-xl border border-border bg-card p-5 text-sm text-muted">
              <p className="font-medium text-ink">How payment & escrow works</p>
              <p className="mt-2">{FUNDS_HOLD_COPY.clientPayOnUpload}</p>
              <p className="mt-2">{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
              <p className="mt-2">
                {FUNDS_HOLD_COPY.chargedOnSubmitRefundIfUnfulfilled}
              </p>
              <p className="mt-2">
                Membership is billed monthly via Stripe. The included review
                resets each billing period. Student reviewers still receive their
                full share; membership discounts are absorbed by the platform.
              </p>
            </div>
          </div>
        </section>

        <HomeCertificate />

        <section
          id="eligibility"
          className="border-t border-border py-14"
          aria-labelledby="eligibility-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="eligibility-heading"
              className="font-serif text-xl font-semibold text-ink md:text-2xl"
            >
              For law students
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted md:text-base">
              Strict qualification is core to product trust. Students must:
            </p>
            <EligibilityChecklist />
            <p className="mt-6 text-sm text-muted">
              <Link
                href="/signup?role=student"
                className="font-medium text-accent underline underline-offset-2"
              >
                Start the student application
              </Link>
              {" · "}
              <Link
                href="/onboarding/student"
                className="font-medium text-accent underline underline-offset-2"
              >
                Eligibility & documents
              </Link>
            </p>
          </div>
        </section>

        <HomeResources />
        <HomeClosingCta />

        <section
          id="contact"
          className="border-t border-border bg-card py-12"
          aria-labelledby="contact-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="contact-heading"
              className="font-serif text-xl font-semibold text-ink"
            >
              Contact
            </h2>
            <p className="mt-3 text-muted">
              Support:{" "}
              <a
                className="font-medium text-accent underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer
        className="site-footer border-t border-border px-6 py-10 text-sm"
        role="contentinfo"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <BrandLockup href={null} />
            <p className="footer-muted mt-3 max-w-md">
              Independent citation verification for the bar and the bench.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2">
            <Link href="/about" className="btn-on-dark">
              About
            </Link>
            <Link href="/#pricing" className="btn-on-dark">
              Pricing
            </Link>
            <Link href="/#resources" className="btn-on-dark">
              Resources
            </Link>
            <Link href="/terms" className="btn-on-dark">
              Terms of Service
            </Link>
            <Link href="/privacy" className="btn-on-dark">
              Privacy Policy
            </Link>
            <Link href="/disclaimer" className="btn-on-dark">
              Disclaimer
            </Link>
            <Link href="/accessibility" className="btn-on-dark">
              Accessibility
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-on-dark">
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
        <div className="mx-auto mt-8 max-w-5xl border-t border-white/20 pt-6">
          <LiabilityFooter className="footer-muted text-xs leading-relaxed" />
        </div>
      </footer>
    </div>
  );
}
