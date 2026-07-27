import type { Metadata } from "next";
import Link from "next/link";
import {
  DISCLAIMER_COPY_VERSION,
  FULL_DISCLAIMER_SECTIONS,
} from "@2dcite/shared";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Disclaimer",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <article className="prose-a11y mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs text-muted">
            Copy version {DISCLAIMER_COPY_VERSION}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
            Disclaimer
          </h1>
          <div className="prose-sm mt-8 space-y-4 leading-relaxed text-muted">
            {FULL_DISCLAIMER_SECTIONS.map((section, i) => (
              <div key={section.heading ?? `intro-${i}`}>
                {section.heading && (
                  <h2 className="pt-4 font-serif text-xl font-semibold text-ink">
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 64)} className="mt-3">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-muted">
            This page is product positioning language. Final Terms should be
            reviewed by counsel before public launch.{" "}
            <Link href="/" className="content-link">
              Back home
            </Link>
            {" · "}
            <Link href="/terms" className="content-link">
              Terms
            </Link>
            {" · "}
            <Link href="/privacy" className="content-link">
              Privacy
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
