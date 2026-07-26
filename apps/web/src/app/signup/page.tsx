import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SignupForm } from "@/components/auth/SignupForm";
import { getSessionUserFromCookies } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign up",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getSessionUserFromCookies();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const initialRole = params.role === "student" ? "STUDENT" : "ATTORNEY";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-md px-6 py-16" tabIndex={-1}>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Create an account
        </h1>
        <p className="mt-3 text-sm text-muted">
          Students must complete eligibility verification before receiving
          assignments. Attorneys and judges can submit jobs after Phase 2
          payments ship.
        </p>
        <SignupForm initialRole={initialRole} />
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="content-link font-medium">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
