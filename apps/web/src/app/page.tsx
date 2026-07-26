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
import { SiteHeader } from "@/components/marketing/SiteHeader";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function HomePage() {
  const standard = computeFeeBreakdown({ isRush: false });
  const rush = computeFeeBreakdown({ isRush: true });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-20" aria-labelledby="hero-heading">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-gold">
            Human-in-the-loop citation review
          </p>
          <h1
            id="hero-heading"
            className="font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl"
          >
            Independent citation verification
            <br />
            for briefs and court orders
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            2dcite matches attorneys and judges with qualified law students
            (2L/3L) who independently check citations for accuracy, format, and
            support. Receive a formal{" "}
            <strong className="font-medium text-ink">
              Certificate of Citation Review
            </strong>{" "}
            as evidence of best efforts and risk mitigation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/signup?role=student"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-ink hover:bg-accent-soft"
            >
              Apply as a student
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-md px-5 py-2.5 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-10 max-w-2xl rounded-lg border border-border bg-accent-soft/50 p-4 text-sm text-muted">
            <p className="font-medium text-ink">Important</p>
            <p className="mt-1">{LIABILITY_CORE.ultimateLiability}</p>
            <p className="mt-2">{LIABILITY_CORE.nonDelegableDuty}</p>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-border bg-card py-16"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="how-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Upload & pay",
                  body: "Attorney or judge uploads a PDF, chooses Standard or Rush, accepts liability acknowledgments, and pays. Funds are held by 2dcite.",
                },
                {
                  step: "2",
                  title: "Matched",
                  body: "An approved 2L/3L student with no active assignment is auto-assigned and accepts the job.",
                },
                {
                  step: "3",
                  title: "Independent review",
                  body: "Student reviews citations for accuracy, format, and whether authorities support the propositions—then attests.",
                },
                {
                  step: "4",
                  title: "Certificate & release",
                  body: "System auto-generates the Certificate of Citation Review. Student share is released from hold; platform retains its fee.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="rounded-lg border border-border bg-background p-5"
                >
                  <span className="text-xs font-semibold text-gold">
                    Step {item.step}
                  </span>
                  <h3 className="mt-2 font-medium text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-muted">
              {FUNDS_HOLD_COPY.clientPayOnUpload}{" "}
              {FUNDS_HOLD_COPY.releaseOnCertificate}
            </p>
          </div>
        </section>

        <section id="pricing" className="py-16" aria-labelledby="pricing-heading">
          <div className="mx-auto max-w-5xl px-6">
            <h2
              id="pricing-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              Simple fixed pricing
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              One transparent fee per job (placeholder amounts—confirm before
              launch). Recommended max {PRICING_DEFAULTS.maxPages} pages for MVP.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm font-medium text-gold">Standard</p>
                <p className="mt-2 font-serif text-3xl font-semibold text-ink">
                  {usd(standard.grossCents)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {PRICING_DEFAULTS.standardSlaHours} hours after student accepts
                </p>
              </div>
              <div className="rounded-lg border border-accent bg-accent-soft/40 p-6">
                <p className="text-sm font-medium text-gold">Rush</p>
                <p className="mt-2 font-serif text-3xl font-semibold text-ink">
                  {usd(rush.grossCents)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {PRICING_DEFAULTS.rushSlaHours} hours after accept · priority
                  matching
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="eligibility" className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Student eligibility
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Strict qualification is core to product trust. Students must:
            </p>
            <ul className="mt-6 list-inside list-disc space-y-2 text-muted">
              <li>Be currently enrolled at an accredited law school</li>
              <li>Be a 2L or 3L</li>
              <li>Have taken and passed a legal writing course</li>
              <li>Be recommended by a professor</li>
              <li>Pass manual admin review of uploaded proof</li>
              <li>Hold only one active assignment at a time</li>
            </ul>
          </div>
        </section>

        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {CERTIFICATE_BOILERPLATE.title}
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              {CERTIFICATE_BOILERPLATE.limitedScope}
            </p>
            <p className="mt-3 max-w-2xl text-muted">
              {CERTIFICATE_BOILERPLATE.mayFileOrRetain}
            </p>
          </div>
        </section>

        <section id="contact" className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
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

      <footer
        className="border-t border-border bg-ink px-6 py-10 text-sm text-white/80"
        role="contentinfo"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-serif text-lg text-white">2dcite</p>
            <p className="mt-2 max-w-md text-white/75">
              Independent citation verification for the bar and the bench.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2">
            <Link href="/#pricing" className="underline-offset-2 hover:text-white hover:underline">
              Pricing
            </Link>
            <Link href="/terms" className="underline-offset-2 hover:text-white hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="underline-offset-2 hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <Link href="/disclaimer" className="underline-offset-2 hover:text-white hover:underline">
              Disclaimer
            </Link>
            <Link href="/accessibility" className="underline-offset-2 hover:text-white hover:underline">
              Accessibility
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="underline-offset-2 hover:text-white hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
        <div className="mx-auto mt-8 max-w-5xl border-t border-white/20 pt-6 text-white/70">
          <LiabilityFooter />
        </div>
      </footer>
    </div>
  );
}
