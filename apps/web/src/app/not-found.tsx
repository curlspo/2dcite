import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gold">
          404
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mt-3 text-muted">
          That page doesn’t exist or you don’t have access.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
