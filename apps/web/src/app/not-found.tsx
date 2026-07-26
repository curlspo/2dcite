import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto max-w-lg px-6 py-24 text-center"
        tabIndex={-1}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-gold">
          Error 404
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mt-3 text-muted">
          That page doesn’t exist or you don’t have access.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Go home
        </Link>
      </main>
    </div>
  );
}
