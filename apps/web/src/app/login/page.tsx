import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-serif text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-3 text-sm text-muted">
          Auth (email/password + session tokens for web and iOS) lands in Phase
          1. This is a placeholder shell.
        </p>
        <div className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
          <label className="block text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              disabled
              placeholder="you@firm.com"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-ink opacity-60"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Password</span>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 opacity-60"
            />
          </label>
          <button
            type="button"
            disabled
            className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white opacity-60"
          >
            Sign in (coming soon)
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="text-accent underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
