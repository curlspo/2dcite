import type { Metadata } from "next";
import Link from "next/link";
import {
  CONFIDENTIALITY_CORE,
  IP_NOTICE,
  SUPPORT_EMAIL,
} from "@2dcite/shared";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How 2dcite collects, uses, shares, and protects personal information—including blind matching for student reviewers, California privacy rights, and GDPR.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://2dcite.com/privacy" },
};

const EFFECTIVE = "July 27, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <article className="prose-a11y mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs text-muted">
            Effective {EFFECTIVE} · For counsel confirmation as practices evolve
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
            Privacy Policy
          </h1>
          <p className="mt-6 leading-relaxed text-muted">
            This Privacy Policy explains how 2dcite (“2dcite,” “we,” “us,” or
            “our”) collects, uses, discloses, retains, and protects personal
            information when you use 2dcite.com, related applications, and
            services (the “Services”). It is designed to address requirements
            under California law (including the California Consumer Privacy Act
            as amended by the CPRA, “CCPA”), the EU/UK General Data Protection
            Regulation (“GDPR”) where applicable, and other applicable privacy
            laws.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            Controller contact for privacy requests:{" "}
            <a className="text-accent underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            . If we appoint an EU/UK representative or DPO, we will update this
            page.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            1. Who we are and what we do
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            2dcite operates a marketplace that connects licensed attorneys and
            judges with approved 2L/3L law students for independent,
            human-in-the-loop citation verification of legal work product. We
            process account data, eligibility materials, uploaded documents,
            review findings, payment metadata, certificates, and operational
            logs to provide that service—not to sell personal information or to
            provide legal advice.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            2. Categories of information we collect
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Depending on your role and use of the Services, we may collect:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong className="font-medium text-ink">Identifiers &amp; account data:</strong>{" "}
              name, email address, role (attorney, judge, student, admin), bar
              or license number (attorneys/judges), organization name if
              provided.
            </li>
            <li>
              <strong className="font-medium text-ink">Authentication credentials:</strong>{" "}
              we store only a{" "}
              <strong className="font-medium text-ink">one-way password hash</strong>{" "}
              (bcrypt). We do{" "}
              <strong className="font-medium text-ink">not</strong> store passwords
              in plain text and cannot recover your original password.
            </li>
            <li>
              <strong className="font-medium text-ink">Student eligibility data:</strong>{" "}
              law school, year (2L/3L), professor name and email, proof
              documents (enrollment, legal writing, recommendation), and
              approval status.
            </li>
            <li>
              <strong className="font-medium text-ink">Job &amp; review content:</strong>{" "}
              document titles, optional instructions, uploaded PDFs or tables of
              authorities, citation findings, overall notes, certificates, and
              related status history.
            </li>
            <li>
              <strong className="font-medium text-ink">Commercial &amp; payment data:</strong>{" "}
              fee amounts, membership status, payout hold/release state, and
              Stripe identifiers. Card numbers and full payment credentials are
              processed by Stripe; we do not store full card numbers on 2dcite
              servers.
            </li>
            <li>
              <strong className="font-medium text-ink">Technical &amp; security data:</strong>{" "}
              IP address (best-effort from proxies), user agent, session tokens
              (hashed at rest where applicable), audit logs of security-relevant
              actions, and diagnostic health metrics.
            </li>
          </ul>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            3. Sources of information
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>Directly from you (registration, uploads, reviews, support)</li>
            <li>Automatically from your browser or app (logs, security signals)</li>
            <li>
              From service providers acting on our instructions (e.g., Stripe
              payment confirmation webhooks, hosting)
            </li>
          </ul>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            4. How we use information (purposes)
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>Create and secure accounts; authenticate sessions</li>
            <li>Verify student eligibility and operate admin approval</li>
            <li>
              Match jobs under a{" "}
              <strong className="font-medium text-ink">blind matching</strong>{" "}
              model (see §6)
            </li>
            <li>
              Deliver documents and findings to authorized parties; generate
              Certificates of Citation Review
            </li>
            <li>
              Process payments, memberships, fund holds, and student-share
              release
            </li>
            <li>
              Sanitize inputs, prevent abuse, detect fraud, rate-limit
              endpoints, and maintain audit trails
            </li>
            <li>
              Comply with law, respond to lawful process, and retain records for
              court or bar association review when required
            </li>
            <li>Communicate service, security, and transactional messages</li>
            <li>Improve reliability and product operations (aggregated/metrics where feasible)</li>
          </ul>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            5. Legal bases (GDPR / UK GDPR)
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Where GDPR applies, we process personal data on one or more of these
            bases:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong className="font-medium text-ink">Contract</strong> — to
              provide the Services you request (Art. 6(1)(b))
            </li>
            <li>
              <strong className="font-medium text-ink">Legitimate interests</strong>{" "}
              — security, fraud prevention, product integrity, blind-matching
              protection for students, and internal operations, balanced against
              your rights (Art. 6(1)(f))
            </li>
            <li>
              <strong className="font-medium text-ink">Legal obligation</strong> —
              tax, accounting, response to valid legal process (Art. 6(1)(c))
            </li>
            <li>
              <strong className="font-medium text-ink">Consent</strong> — where we
              expressly ask for it (and you may withdraw it without affecting
              prior processing)
            </li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted">
            Special-category data is not required for 2dcite. Do not upload
            health, biometric, or other special-category data unless you have a
            lawful basis and it is strictly necessary for your matter; you remain
            responsible for such uploads.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            6. Blind matching and student identity protection
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            {CONFIDENTIALITY_CORE.blindMatching}
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            {CONFIDENTIALITY_CORE.blindMatchingRetention}
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            In ordinary product use, submitting attorneys and judges see that a
            qualified student was assigned and receive findings and certificates,{" "}
            <strong className="font-medium text-ink">
              not the student’s name, email, school, or user id
            </strong>
            . Platform administrators may access identity as needed to operate,
            secure, and support the service. Students remain bound by
            confidentiality toward clients.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            {CONFIDENTIALITY_CORE.findingsOnlyToClient}
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            {CONFIDENTIALITY_CORE.studentConfidentiality}
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            7. How we share information
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            We do{" "}
            <strong className="font-medium text-ink">not sell</strong> personal
            information and we do not “share” it for cross-context behavioral
            advertising as those terms are defined under the CCPA. We disclose
            information only as follows:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong className="font-medium text-ink">Service providers / processors:</strong>{" "}
              hosting (e.g. Vercel), database (e.g. Neon/Postgres), object
              storage, email, and Stripe for payments—under contractual
              confidentiality and purpose limits.
            </li>
            <li>
              <strong className="font-medium text-ink">Assigned participants:</strong>{" "}
              job documents and instructions to the assigned student; findings
              and certificates to the submitting attorney/judge—under blind
              matching for student identity.
            </li>
            <li>
              <strong className="font-medium text-ink">Legal &amp; safety:</strong>{" "}
              when required by law, court order, bar association process, or to
              protect rights, safety, and integrity of the Services.
            </li>
            <li>
              <strong className="font-medium text-ink">Business transfers:</strong>{" "}
              in connection with a merger, acquisition, or asset sale, subject
              to continued protection consistent with this Policy.
            </li>
          </ul>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            8. Retention (including court and bar review)
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            We retain account, job, review, certificate, payment, membership,
            and audit records for as long as needed to operate the Services,
            resolve disputes, enforce agreements, secure the platform, and meet
            legal, tax, and professional-accountability needs.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            In particular, we retain job and reviewer linkage records so that if
            a{" "}
            <strong className="font-medium text-ink">
              court, bar association, or other lawful authority
            </strong>{" "}
            requires production or review, 2dcite can produce the retained
            information. That retention does not mean we disclose student
            identity to submitting counsel in ordinary product use.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            When retention is no longer necessary, we delete or de-identify data
            subject to backup cycles and legal holds. You may request deletion
            (see §11–12); we may decline or limit deletion where we must retain
            records for legal holds, fraud prevention, accounting, or ongoing
            disputes.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            9. Security measures
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>TLS encryption in transit for the hosted website and API</li>
            <li>
              Passwords stored only as bcrypt hashes (not plain text); session
              tokens handled with secure cookie practices
            </li>
            <li>
              Role-based access control (attorney/judge, student, admin) and
              authorization checks on job endpoints
            </li>
            <li>
              Input validation and sanitization (length limits, control-character
              stripping, schema validation) on user-supplied fields
            </li>
            <li>
              Rate limiting on authentication and other abuse-sensitive
              endpoints
            </li>
            <li>Audit logging of security-relevant actions</li>
            <li>
              Payment card data handled by Stripe (PCI DSS–compliant provider);
              not stored as full PANs on 2dcite
            </li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted">
            No method of transmission or storage is 100% secure.{" "}
            {CONFIDENTIALITY_CORE.clientSoleRiskOfUpload}
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            {CONFIDENTIALITY_CORE.noResponsibilityForConfidential}{" "}
            {CONFIDENTIALITY_CORE.limitedSubmissionToa}
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            10. International transfers
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            We are based in the United States. If you access the Services from
            the EEA, UK, or other regions, your information may be processed in
            the United States and other countries where our providers operate.
            Where required, we rely on appropriate transfer mechanisms (such as
            Standard Contractual Clauses) with processors.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            11. Your privacy rights (California — CCPA/CPRA)
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            If you are a California resident, you may have the right to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              Know / access categories and specific pieces of personal
              information we collected about you
            </li>
            <li>Delete personal information, subject to legal exceptions</li>
            <li>Correct inaccurate personal information</li>
            <li>
              Opt out of sale or sharing of personal information (we do not sell
              or share for cross-context behavioral advertising)
            </li>
            <li>
              Limit use of sensitive personal information to purposes necessary
              to perform the Services (we use sensitive data such as account
              credentials and professional identifiers only as described here)
            </li>
            <li>Non-discrimination for exercising CCPA rights</li>
          </ul>
          <p className="mt-3 leading-relaxed text-muted">
            Categories collected (for CCPA notice-at-collection style
            transparency) include identifiers, professional information, internet
            or electronic activity (logs), commercial information (transactions),
            and inferences only as needed for matching and fraud prevention—not
            for advertising profiles.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            To exercise rights, email{" "}
            <a className="text-accent underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            with “California Privacy Request” in the subject. We will verify
            your identity (e.g., account email control) before fulfilling. You
            may use an authorized agent as permitted by law.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            We do not use or disclose sensitive personal information for
            purposes that require a right-to-limit beyond what is necessary to
            provide the Services.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            12. Your privacy rights (GDPR / UK GDPR)
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Where GDPR applies, you may have rights to access, rectification,
            erasure, restriction, portability, and objection (including to
            processing based on legitimate interests), and to withdraw consent
            where processing is consent-based. You may lodge a complaint with
            your local supervisory authority. Contact{" "}
            <a className="text-accent underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            to exercise rights. We may need to retain certain records as
            described in §8.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            13. Cookies and similar technologies
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            We use essential cookies and similar storage for authentication
            (session), security, and load balancing. We do not operate
            third-party advertising cookies on the core product surfaces
            described here. Browser controls may block cookies; blocking
            essential cookies may prevent sign-in.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            14. Children
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            The Services are for adults engaged in legal practice or law study
            (2L/3L). We do not knowingly collect personal information from
            children under 16 (or under 13 where COPPA applies). Contact us to
            request deletion if you believe we have collected such data in
            error.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            15. Intellectual property notice (related to our systems)
          </h2>
          <p className="mt-3 leading-relaxed text-muted">{IP_NOTICE.copyright}</p>
          <p className="mt-3 leading-relaxed text-muted">{IP_NOTICE.noLicense}</p>
          <p className="mt-3 leading-relaxed text-muted">
            This section concerns ownership of our software and materials; it
            does not transfer ownership of the legal documents you upload. You
            retain rights in your submissions, subject to the limited license
            needed for us to host, process, match, and deliver the Services.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            16. Changes to this Policy
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            We may update this Policy from time to time. We will post the
            revised version with an updated effective date. Material changes may
            also be communicated by email or in-product notice where
            appropriate.
          </p>

          <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
            17. Contact
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Privacy and data-protection requests:{" "}
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
