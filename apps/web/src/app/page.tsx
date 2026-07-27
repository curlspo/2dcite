import Link from "next/link";
import {
  CERTIFICATE_BOILERPLATE,
  FUNDS_HOLD_COPY,
  LIABILITY_CORE,
  PRICING_DEFAULTS,
  SUPPORT_EMAIL,
  computeFeeBreakdown,
} from "@2dcite/shared";
import { LiabilityFooter } from "@/components/legal/LiabilityFooter";
import { BrandLockup } from "@/components/marketing/BrandMark";
import { EligibilityChecklist } from "@/components/marketing/EligibilityChecklist";
import { EntryCard } from "@/components/marketing/EntryCard";
import { PricingCards } from "@/components/marketing/PricingCards";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { StepList, type HowStep } from "@/components/marketing/StepCard";
import { TrustStrip } from "@/components/marketing/TrustStrip";

export default function HomePage() {
  const standard = computeFeeBreakdown({ isRush: false });
  const rush = computeFeeBreakdown({ isRush: true });

  const steps: HowStep[] = [
    {
      step: 1,
      title: "Upload & pay",
      body: "Submit a full PDF or table of authorities only—before or after filing—and choose Standard or Rush.",
      note: "You’re charged when you submit — fully refunded if your document isn’t reviewed.",
    },
    {
      step: 2,
      title: "Matched",
      body: "An approved 2L/3L student bound by confidentiality is auto-assigned and accepts the job.",
    },
    {
      step: 3,
      title: "Independent review",
      body: "The student verifies citations and reports findings only to you—an independent layer, not legal advice.",
      note: "You alone decide any correction, errata, or withdrawal under applicable rules.",
      emphasize: true,
    },
    {
      step: 4,
      title: "Certificate & release",
      body: "2dcite auto-generates the Certificate of Citation Review and releases the student’s share from hold.",
      note: "2dcite holds your payment until the certificate is issued, then releases the student’s share.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      <SiteHeader />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Hero */}
        <section
          className="mx-auto max-w-5xl px-6 pb-12 pt-14 md:pb-16 md:pt-20"
          aria-labelledby="hero-heading"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
            Human-in-the-loop citation review
          </p>
          <h1
            id="hero-heading"
            className="max-w-3xl font-serif text-4xl font-semibold leading-[1.15] text-ink md:text-5xl"
          >
            Independent citation verification for briefs and court orders
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Qualified 2L/3L students independently verify citations. You receive
            a formal Certificate of Citation Review.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <EntryCard
              href="/signup"
              title="For attorneys & judges"
              description="Upload a brief, order, or table of authorities. Pay fixed fee; funds held until certificate."
              cta="Get started"
              variant="primary"
            />
            <EntryCard
              href="/signup?role=student"
              title="For law students"
              description="2L/3L eligibility, professor recommendation, and admin approval required."
              cta="Apply as a student"
              variant="secondary"
            />
          </div>

          <p className="mt-4 text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-accent underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>

          <div className="mt-8 border-t border-border pt-6">
            <TrustStrip
              text={`${LIABILITY_CORE.ultimateLiability.replace(/\.$/, "")} — this is an independent review layer, not legal advice.`}
              href="/disclaimer"
              linkLabel="Read full disclaimer"
            />
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-y border-border bg-surface-muted/60 py-16"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="how-heading"
              className="font-serif text-2xl font-semibold text-ink md:text-3xl"
            >
              How it works
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
              Four steps from upload to certificate. Liability remains with you;
              the student provides independent verification only.
            </p>
            <StepList steps={steps} />
            <div className="mt-10 rounded-xl border border-border bg-card p-5 text-sm text-muted">
              <p className="font-medium text-ink">How payment & escrow works</p>
              <p className="mt-2">{FUNDS_HOLD_COPY.clientPayOnUpload}</p>
              <p className="mt-2">{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
              <p className="mt-2">
                {FUNDS_HOLD_COPY.chargedOnSubmitRefundIfUnfulfilled}
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16" aria-labelledby="pricing-heading">
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="pricing-heading"
              className="font-serif text-2xl font-semibold text-ink md:text-3xl"
            >
              Simple fixed pricing
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              One transparent fee per job. Recommended max{" "}
              {PRICING_DEFAULTS.maxPages} pages for MVP.
            </p>
            <PricingCards
              tiers={[
                {
                  name: "Standard",
                  priceCents: standard.grossCents,
                  turnaround: `${PRICING_DEFAULTS.standardSlaHours} hours after student accepts`,
                  includes: [
                    "Independent citation verification",
                    "Full PDF or table of authorities",
                    "Certificate of Citation Review",
                  ],
                },
                {
                  name: "Rush",
                  priceCents: rush.grossCents,
                  turnaround: `${PRICING_DEFAULTS.rushSlaHours} hours after accept · priority matching`,
                  includes: [
                    "Everything in Standard",
                    "Faster turnaround after accept",
                    "Priority place in the matching queue",
                  ],
                  badge: "Faster",
                  highlighted: true,
                },
              ]}
            />
          </div>
        </section>

        {/* Eligibility */}
        <section
          id="eligibility"
          className="border-t border-border bg-card py-16"
          aria-labelledby="eligibility-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="eligibility-heading"
              className="font-serif text-2xl font-semibold text-ink md:text-3xl"
            >
              Student eligibility
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Strict qualification is core to product trust. Students must:
            </p>
            <EligibilityChecklist />
            <p className="mt-6 text-sm text-muted">
              Ready to apply?{" "}
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

        {/* Certificate */}
        <section
          className="border-t border-border py-16"
          aria-labelledby="certificate-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="certificate-heading"
              className="font-serif text-2xl font-semibold text-ink md:text-3xl"
            >
              {CERTIFICATE_BOILERPLATE.title}
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              {CERTIFICATE_BOILERPLATE.limitedScope}
            </p>
            <p className="mt-3 max-w-2xl text-muted">
              {CERTIFICATE_BOILERPLATE.mayFileOrRetain}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Attorneys may file or retain the certificate as evidence of best
              efforts. Judges may retain it as an internal risk-mitigation
              record—liability always remains with the licensed attorney or
              judge.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="border-t border-border bg-card py-16"
          aria-labelledby="contact-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="contact-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              Contact
            </h2>
            <p className="mt-3 text-muted">
              Support and launch inquiries:{" "}
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

      <footer className="site-footer border-t border-border px-6 py-10 text-sm" role="contentinfo">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <BrandLockup href={null} />
            <p className="footer-muted mt-3 max-w-md">
              Independent citation verification for the bar and the bench.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2">
            <Link href="/#pricing" className="btn-on-dark">
              Pricing
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
