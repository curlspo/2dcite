import Link from "next/link";
import { LiabilityFooter } from "@/components/legal/LiabilityFooter";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SessionUser } from "@/lib/session";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const nav =
    user.role === "ADMIN"
      ? [
          { href: "/admin", label: "Overview" },
          { href: "/admin/students", label: "Students" },
          { href: "/admin/jobs", label: "Jobs" },
          { href: "/admin/payouts", label: "Payouts" },
          { href: "/admin/audit", label: "Audit" },
          { href: "/admin/mfa", label: "MFA" },
        ]
      : user.role === "STUDENT"
        ? [
            { href: "/dashboard", label: "Home" },
            { href: "/assignments", label: "Assignments" },
            { href: "/onboarding/student", label: "Eligibility" },
          ]
        : [
            { href: "/dashboard", label: "Home" },
            { href: "/jobs", label: "Jobs" },
            { href: "/jobs/new", label: "New review" },
            { href: "/membership", label: "Membership" },
          ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card" role="banner">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6 md:gap-8">
            <Link
              href="/dashboard"
              className="font-serif text-lg font-semibold text-ink"
            >
              <span aria-hidden="true">2dcite</span>
              <span className="sr-only">2dcite dashboard home</span>
            </Link>
            <nav aria-label="Account" className="flex flex-wrap gap-3 text-sm md:gap-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="min-h-11 inline-flex items-center text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm md:gap-4">
            <p className="text-muted">
              <span className="sr-only">Signed in as </span>
              {user.name}{" "}
              <span className="text-xs font-medium uppercase tracking-wide text-gold">
                <span className="sr-only">Role: </span>
                {user.role}
              </span>
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-10" tabIndex={-1}>
        {children}
      </main>
      <footer className="border-t border-border px-6 py-6" role="contentinfo">
        <div className="mx-auto max-w-5xl">
          <LiabilityFooter />
          <nav aria-label="Legal" className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
              Privacy
            </Link>
            <Link href="/disclaimer" className="underline underline-offset-2 hover:text-ink">
              Disclaimer
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
