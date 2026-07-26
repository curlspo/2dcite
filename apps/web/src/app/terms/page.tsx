import type { Metadata } from "next";
import Link from "next/link";
import {
  CONFIDENTIALITY_CORE,
  DISCLAIMER_COPY_VERSION,
  FUNDS_HOLD_COPY,
  LIABILITY_CORE,
  SUPPORT_EMAIL,
} from "@2dcite/shared";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
      <article className="prose-a11y mx-auto max-w-2xl px-6 py-16 prose-sm">
        <p className="text-xs text-muted">
          Draft for counsel review · Disclaimer copy {DISCLAIMER_COPY_VERSION}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
          Terms of Service
        </h1>
        <p className="mt-6 leading-relaxed text-muted">
          These Terms govern use of 2dcite (the “Platform”) at 2dcite.com and
          related applications. By creating an account or submitting a document,
          you agree to these Terms.{" "}
          <strong className="font-medium text-ink">
            This draft is not a substitute for review by your counsel before
            public launch.
          </strong>
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          1. Nature of the service
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          2dcite matches licensed attorneys and judges with qualified law
          students who perform an independent human-in-the-loop citation review
          of uploaded briefs or court orders. Upon completion, the Platform may
          issue a Certificate of Citation Review. The Platform is a technology
          and marketplace service—not a law firm.
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {LIABILITY_CORE.notLegalAdvice}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {LIABILITY_CORE.noAttorneyClient}
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          2. Non-delegable duty and liability
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {LIABILITY_CORE.ultimateLiability}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {LIABILITY_CORE.nonDelegableDuty}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {LIABILITY_CORE.noPlatformResponsibility}
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          3. Accounts and eligibility
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Attorneys and judges must be authorized to practice or sit as
          applicable in their jurisdiction. Students must be currently enrolled
          2L or 3L students at an accredited law school, have passed a legal
          writing course, and be recommended by a professor. Student
          applications are subject to manual Platform approval. Students may
          hold only one active assignment at a time.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          4. Payments, hold, and release
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {FUNDS_HOLD_COPY.clientPayOnUpload}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {FUNDS_HOLD_COPY.releaseOnCertificate}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Fees are fixed at checkout (including any Rush surcharge). Except as
          required by law or expressly stated in a refund policy approved by
          counsel, payment is non-refundable once a student has accepted an
          assignment. If a job is cancelled before certificate issuance,
          treatment of held funds (refund or retention) will follow Platform
          policy and applicable payment-network rules.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          5. Certificates
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {LIABILITY_CORE.certificateScope}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Certificates may be filed with a document or retained as evidence of
          risk mitigation and best efforts through independent verification, at
          the submitting party’s professional discretion.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          6. Documents, limited submissions, and confidentiality
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          You represent that you have the right to upload materials and that
          doing so does not violate court rules, protective orders, or third-party
          rights.
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.noResponsibilityForConfidential}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.limitedSubmissionToa}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.clientSoleRiskOfUpload}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          The Platform will implement reasonable technical and organizational
          measures to limit access to job participants and administrators. See
          the Privacy Policy for details. Those measures do not create
          responsibility for confidential content you elect to submit.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          7. Student confidentiality and non-disclosure of failed citations
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.studentConfidentiality}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.noDisclosureOfFailedCitations}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.findingsOnlyToClient}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Students agree to these obligations as a condition of receiving
          assignments and submitting reviews. Breach may result in suspension,
          forfeiture of payouts, and other remedies. “Required by law” includes
          valid court orders, lawful subpoenas, and other compulsory process;
          where legally permitted, students and the Platform will provide notice
          to the submitting party before disclosure.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          8. Acceptable use
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          You may not use the Platform for unlawful purposes, to harass others,
          to upload malware, to circumvent eligibility rules, to misrepresent
          credentials, or to pressure students to disclose confidential review
          outcomes outside the Platform. We may suspend accounts for abuse or
          risk.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          9. Limitation of liability
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          To the fullest extent permitted by law, 2dcite and its operators are
          not liable for professional malpractice claims arising from your
          filings, for student review quality beyond the platform’s stated
          facilitation role, for confidential materials you upload, for
          unauthorized disclosure by third parties, or for consequential damages.
          Aggregate liability related to a job is limited to fees paid for that
          job. Some jurisdictions do not allow certain limitations.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          10. Contact
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Questions:{" "}
          <a className="text-accent underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>

        <p className="mt-10 text-sm text-muted">
          <Link href="/" className="content-link">
            Back home
          </Link>
          {" · "}
          <Link href="/privacy" className="content-link">
            Privacy
          </Link>
          {" · "}
          <Link href="/disclaimer" className="content-link">
            Disclaimer
          </Link>
          {" · "}
          <Link href="/accessibility" className="content-link">
            Accessibility
          </Link>
        </p>
      </article>
      </main>
    </div>
  );
}
