import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@2dcite/shared";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "2dcite accessibility commitment, WCAG-oriented practices, and how to request assistance.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main
        id="main-content"
        className="prose-a11y mx-auto max-w-2xl px-6 py-16"
        tabIndex={-1}
      >
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Accessibility statement
        </h1>
        <p className="mt-6 leading-relaxed text-muted">
          2dcite is committed to making our website usable by people with
          disabilities and to conforming with the{" "}
          <strong className="font-medium text-ink">
            Web Content Accessibility Guidelines (WCAG) 2.2 Level AA
          </strong>{" "}
          to the extent practicable. This statement describes our approach and
          how to request help.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Measures we take
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>Semantic HTML landmarks (banner, navigation, main, contentinfo)</li>
          <li>Skip link to main content for keyboard users</li>
          <li>Visible focus indicators on interactive controls</li>
          <li>Form labels, error messages with <code>role=&quot;alert&quot;</code>, and descriptive buttons</li>
          <li>Color contrast improved for text and UI chrome</li>
          <li>Support for reduced motion preferences</li>
          <li>Responsive layout with adequate touch targets where practical</li>
          <li>Language attribute on the document (<code>lang=&quot;en&quot;</code>)</li>
        </ul>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Compatibility
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          We aim for compatibility with current versions of major browsers and
          assistive technologies (including VoiceOver, NVDA, and JAWS) on common
          platforms. The site requires JavaScript for interactive account
          features (sign-in, job submission, reviews).
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Known limitations
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>
            PDF document viewing depends on the browser or OS PDF viewer; we
            provide downloadable certificates and source PDFs.
          </li>
          <li>
            Some admin workflows still use browser prompts (e.g. reject reason);
            we plan to replace these with accessible dialogs.
          </li>
          <li>
            Third-party payment checkout (Stripe) is subject to Stripe’s own
            accessibility practices when enabled.
          </li>
        </ul>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Feedback and assistance
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          If you encounter an accessibility barrier or need information in an
          alternate format, contact us:
        </p>
        <p className="mt-3">
          <a className="content-link font-medium" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="mt-3 text-sm text-muted">
          Please include the page URL and a description of the issue. We aim to
          respond within two business days.
        </p>

        <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
          Formal complaints
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Users in the United States may also have rights under the Americans
          with Disabilities Act (ADA) and Section 504/508 where applicable. This
          statement is not legal advice.
        </p>

        <p className="mt-10 text-sm text-muted">
          <Link href="/" className="content-link">
            Back home
          </Link>
        </p>
      </main>
    </div>
  );
}
