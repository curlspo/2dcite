import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <ForgotPasswordPageInner searchParams={searchParams} />
  );
}

async function ForgotPasswordPageInner({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const sp = await searchParams;
  const initialEmail = typeof sp.email === "string" ? sp.email : "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto max-w-md px-6 py-16"
        tabIndex={-1}
      >
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Recover your password
        </h1>
        <p className="mt-3 text-sm text-muted">
          Enter the email address for your 2dcite account. If it matches a
          registered user, we will send a secure link to set a new password.
        </p>
        <ForgotPasswordForm initialEmail={initialEmail} />
        <p className="mt-6 text-sm text-muted">
          <Link href="/login" className="content-link font-medium">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
