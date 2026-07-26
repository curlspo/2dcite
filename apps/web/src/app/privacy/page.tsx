import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Privacy Policy
        </h1>
        <p className="mt-6 text-muted">
          Placeholder for counsel-reviewed Privacy Policy. Will address document
          confidentiality, retention, subprocessors (Stripe, storage, email),
          and user rights.
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
