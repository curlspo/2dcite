import type { Metadata } from "next";
import Link from "next/link";
import { CONFIDENTIALITY_CORE, SUPPORT_EMAIL } from "@2dcite/shared";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
      <article className="prose-a11y mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs text-muted">Draft for counsel review</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
          Privacy Policy
        </h1>
        <p className="mt-6 leading-relaxed text-muted">
          This Privacy Policy describes how 2dcite (“we”) collects, uses, and
          shares information when you use 2dcite.com and related applications.
          This draft should be reviewed by counsel before public launch.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Information we collect
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>
            Account data: name, email, role (attorney, judge, student, admin),
            password hash
          </li>
          <li>
            Student eligibility materials: law school, year, professor contact,
            uploaded proof documents
          </li>
          <li>
            Job materials: PDF briefs/orders, tables of authorities, titles,
            instructions, review findings, certificates
          </li>
          <li>
            Payment data processed by Stripe (we do not store full card numbers)
          </li>
          <li>Technical logs: IP, device, audit events for security and ops</li>
        </ul>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          How we use information
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>Provide citation-review marketplace services</li>
          <li>Verify student eligibility and match jobs</li>
          <li>Process payments, hold funds, and release student shares</li>
          <li>Generate Certificates of Citation Review</li>
          <li>Secure the Platform, prevent fraud, and comply with law</li>
          <li>Communicate about jobs, accounts, and service updates</li>
        </ul>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Sharing
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Job documents and findings are shared with the assigned student (and
          reverse) as needed to perform the review. We use processors such as
          hosting providers, email delivery, object storage, and Stripe for
          payments. We do not sell personal information.
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.findingsOnlyToClient}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Students are contractually bound not to disclose review materials or
          outcomes outside the platform, including that a citation failed or
          appeared fabricated, except as required by law or with prior written
          authorization from the submitting attorney or judge. See the Terms of
          Service.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Confidential materials
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.noResponsibilityForConfidential}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.limitedSubmissionToa}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {CONFIDENTIALITY_CORE.clientSoleRiskOfUpload}
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Retention
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          We retain account, job, payment, certificate, and audit records for as
          long as needed to operate the service, resolve disputes, and meet legal
          obligations. You may request deletion subject to legal holds and
          legitimate business needs.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Security
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          We use industry-standard measures including encrypted transport (TLS),
          access controls, and hashed passwords. No method of transmission or
          storage is 100% secure.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Contact
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Privacy requests:{" "}
          <a className="text-accent underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>

        <p className="mt-10 text-sm text-muted">
          <Link href="/" className="content-link">
            Back home
          </Link>
          {" · "}
          <Link href="/terms" className="content-link">
            Terms
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
