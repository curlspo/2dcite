import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Terms of Service
        </h1>
        <p className="mt-6 text-muted">
          Placeholder for counsel-reviewed Terms of Service. Will cover account
          eligibility, student qualification, payment hold and release on
          certificate, acceptable use, limitation of liability, and dispute
          processes.
        </p>
        <p className="mt-4 text-sm text-muted">
          <Link href="/" className="text-accent underline">
            Back home
          </Link>
        </p>
      </article>
    </div>
  );
}
