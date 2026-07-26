import type { Metadata } from "next";
import Link from "next/link";
import {
  DISCLAIMER_COPY_VERSION,
  LIABILITY_CORE,
  CERTIFICATE_BOILERPLATE,
  FUNDS_HOLD_COPY,
} from "@2dcite/shared";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Disclaimer",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs text-muted">
          Copy version {DISCLAIMER_COPY_VERSION}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
          Disclaimer
        </h1>
        <div className="prose-sm mt-8 space-y-4 leading-relaxed text-muted">
          <p>{LIABILITY_CORE.ultimateLiability}</p>
          <p>{LIABILITY_CORE.nonDelegableDuty}</p>
          <p>{LIABILITY_CORE.noPlatformResponsibility}</p>
          <p>{LIABILITY_CORE.certificateScope}</p>
          <p>{LIABILITY_CORE.noAttorneyClient}</p>
          <p>{LIABILITY_CORE.notLegalAdvice}</p>
          <p>{CERTIFICATE_BOILERPLATE.mayFileOrRetain}</p>
          <h2 className="pt-4 font-serif text-xl font-semibold text-ink">
            Payments held by the platform
          </h2>
          <p>{FUNDS_HOLD_COPY.clientPayOnUpload}</p>
          <p>{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
        </div>
        <p className="mt-10 text-sm text-muted">
          This page is product positioning language. Final Terms should be
          reviewed by counsel before public launch.{" "}
          <Link href="/" className="text-accent underline">
            Back home
          </Link>
        </p>
      </article>
    </div>
  );
}
