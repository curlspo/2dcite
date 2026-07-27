import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@2dcite/shared";
import { BrandLockup } from "@/components/marketing/BrandMark";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { LiabilityFooter } from "@/components/legal/LiabilityFooter";

export const metadata: Metadata = {
  title: "About",
  description:
    "What 2dcite is and how independent human-in-the-loop citation review works for attorneys and judges—and for law students who perform the verification.",
  openGraph: {
    title: "About 2dcite",
    description:
      "Independent citation verification for briefs and court orders. Human review by qualified law students; liability remains with the licensed attorney or judge.",
    url: "https://2dcite.com/about",
    type: "website",
  },
  alternates: {
    canonical: "https://2dcite.com/about",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      <SiteHeader />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <article className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
            About 2dcite
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl">
            Independent citation review, explained plainly
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            2dcite is a service that connects licensed attorneys and judges with
            qualified law students who independently check citations in legal
            work product. It is designed to support careful practice—not to
            replace professional judgment.
          </p>

          <section className="mt-14" aria-labelledby="problem-heading">
            <h2
              id="problem-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              The problem
            </h2>
            <div className="mt-4 space-y-4 text-muted leading-relaxed">
              <p>
                Citations are load-bearing. A brief, motion, or order depends on
                authorities that actually exist, are accurately described, and
                support the proposition for which they are offered. When a
                citation is wrong—misstated, outdated, or fabricated—the cost is
                not only embarrassment. It can affect credibility with the court,
                opposing counsel, and the public.
              </p>
              <p>
                Generative tools and heavy caseloads make it easier to move
                quickly and harder to catch every reference. Checking every cite
                carefully takes time that many practitioners do not have on the
                eve of filing. The duty to verify, however, remains with the
                licensed attorney or judge. It cannot be handed off.
              </p>
              <p>
                There is also a privacy tension: full drafts may contain
                confidential material, while a table of authorities may be enough
                to confirm that the cited cases exist and are formatted
                correctly.
              </p>
            </div>
          </section>

          <section className="mt-14" aria-labelledby="solution-heading">
            <h2
              id="solution-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              What 2dcite does
            </h2>
            <div className="mt-4 space-y-4 text-muted leading-relaxed">
              <p>
                2dcite provides a structured way to obtain an{" "}
                <strong className="font-medium text-ink">
                  independent, human review of citations
                </strong>
                . An attorney or judge uploads a PDF—either the full document or
                a limited submission such as a table of authorities—chooses a
                turnaround tier, accepts the acknowledgments, and pays a fixed
                fee. Payment is held by 2dcite until a Certificate of Citation
                Review is issued.
              </p>
              <p>
                Approved 2L and 3L law students, bound by confidentiality and
                limited to one active assignment at a time, perform the review.
                Findings are delivered only through the platform to the
                submitting party. Students are an independent verification
                layer; they do not provide legal advice or co-counsel services.
              </p>
              <p>
                When the review is complete, the system issues a formal{" "}
                <strong className="font-medium text-ink">
                  Certificate of Citation Review
                </strong>
                . The certificate is evidence of independent verification and
                best efforts. It is not a warranty of correctness or outcome.
                Liability for the underlying document remains with the licensed
                attorney or judge.
              </p>
            </div>
          </section>

          <section className="mt-14" aria-labelledby="who-heading">
            <h2
              id="who-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              Who it is for
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted leading-relaxed">
              <li>
                <strong className="font-medium text-ink">Attorneys</strong> who
                want a second pair of trained eyes on authorities before or after
                filing.
              </li>
              <li>
                <strong className="font-medium text-ink">Judges</strong> who may
                wish to verify citations in draft or issued orders as an internal
                risk-mitigation step.
              </li>
              <li>
                <strong className="font-medium text-ink">Law students</strong>{" "}
                (2L/3L) who meet eligibility requirements and are approved after
                manual review of credentials.
              </li>
            </ul>
          </section>

          <section className="mt-14" aria-labelledby="principles-heading">
            <h2
              id="principles-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              Principles we keep in view
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted leading-relaxed">
              <li>
                Ultimate liability always remains with the licensed attorney or
                judge.
              </li>
              <li>
                Checking citations is a non-delegable professional duty; students
                verify independently, they do not assume the duty.
              </li>
              <li>
                2dcite and student reviewers do not give legal advice.
              </li>
              <li>
                Confidential materials are the submitting party’s responsibility
                to select and share appropriately; limited submissions (such as a
                TOA) are supported.
              </li>
              <li>
                Student reviewers are bound by confidentiality and may not
                disclose failed or hallucinated citations without written
                authorization from the submitting party.
              </li>
            </ul>
            <p className="mt-4 text-sm text-muted">
              Full legal language is on the{" "}
              <Link href="/disclaimer" className="content-link font-medium">
                Disclaimer
              </Link>
              ,{" "}
              <Link href="/terms" className="content-link font-medium">
                Terms
              </Link>
              , and{" "}
              <Link href="/privacy" className="content-link font-medium">
                Privacy
              </Link>{" "}
              pages.
            </p>
          </section>

          <section className="mt-14" aria-labelledby="build-heading">
            <h2
              id="build-heading"
              className="font-serif text-2xl font-semibold text-ink"
            >
              How this product was built
            </h2>
            <div className="mt-4 space-y-4 text-muted leading-relaxed">
              <p>
                2dcite was designed and implemented with substantial assistance
                from{" "}
                <strong className="font-medium text-ink">Grok</strong>, built by{" "}
                <a
                  href="https://x.ai"
                  className="content-link font-medium"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  xAI
                </a>
                . Grok supported product structure, interface writing, engineering
                implementation, and operational setup. Human judgment remains
                responsible for the service, its policies, and its use.
              </p>
              <p className="text-sm">
                That credit is intentional: the platform exists to keep{" "}
                <em>human</em> verification in the loop for legal citations. The
                same standard applies to how the product itself was made—tools
                may assist; accountability stays with people.
              </p>
            </div>
          </section>

          <section className="mt-14 border-t border-border pt-10" aria-labelledby="next-heading">
            <h2
              id="next-heading"
              className="font-serif text-xl font-semibold text-ink"
            >
              Next steps
            </h2>
            <p className="mt-3 text-muted leading-relaxed">
              Learn the workflow on the{" "}
              <Link href="/#how-it-works" className="content-link font-medium">
                home page
              </Link>
              , review{" "}
              <Link href="/#pricing" className="content-link font-medium">
                pricing
              </Link>
              , or{" "}
              <Link href="/signup" className="content-link font-medium">
                create an account
              </Link>
              . Questions:{" "}
              <a
                className="content-link font-medium"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <footer className="site-footer border-t border-border px-6 py-10 text-sm" role="contentinfo">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <BrandLockup href="/" />
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
            <Link href="/disclaimer" className="btn-on-dark">
              Disclaimer
            </Link>
            <Link href="/terms" className="btn-on-dark">
              Terms
            </Link>
            <Link href="/privacy" className="btn-on-dark">
              Privacy
            </Link>
          </nav>
        </div>
        <div className="mx-auto mt-8 max-w-5xl border-t border-white/20 pt-6">
          <LiabilityFooter className="footer-muted text-xs leading-relaxed" />
        </div>
      </footer>
    </div>
  );
}
