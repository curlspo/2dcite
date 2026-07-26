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
      ? [{ href: "/admin/students", label: "Students" }]
      : user.role === "STUDENT"
        ? [
            { href: "/dashboard", label: "Home" },
            { href: "/onboarding/student", label: "Eligibility" },
          ]
        : [{ href: "/dashboard", label: "Jobs" }];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-serif text-lg font-semibold text-ink">
              2dcite
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">
              {user.name}{" "}
              <span className="text-xs uppercase tracking-wide text-gold">
                {user.role}
              </span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <LiabilityFooter />
        </div>
      </footer>
    </div>
  );
}
