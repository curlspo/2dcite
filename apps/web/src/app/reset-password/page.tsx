import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto max-w-md px-6 py-16"
        tabIndex={-1}
      >
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Set a new password
        </h1>
        {!token ? (
          <div className="mt-6 rounded-lg border border-border bg-card p-6 text-sm text-muted">
            <p>
              This page needs a valid reset link from your email. Request a new
              link from the recovery page.
            </p>
            <p className="mt-4">
              <Link
                href="/forgot-password"
                className="content-link font-medium"
              >
                Recover password
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted">
              Choose a new password (at least 10 characters). You will need to
              sign in again on all devices.
            </p>
            <ResetPasswordForm token={token} />
          </>
        )}
        <p className="mt-6 text-sm text-muted">
          <Link href="/login" className="content-link font-medium">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
