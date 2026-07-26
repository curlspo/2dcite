import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-ink">
          2dcite
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/#how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/#eligibility" className="hover:text-ink">
            Eligibility
          </Link>
          <Link href="/disclaimer" className="hover:text-ink">
            Disclaimer
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
