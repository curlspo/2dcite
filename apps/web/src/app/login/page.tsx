import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSessionUserFromCookies } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await getSessionUserFromCookies();
  if (user) {
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "STUDENT" && user.studentProfile?.status !== "APPROVED") {
      redirect("/onboarding/student");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-md px-6 py-16" tabIndex={-1}>
        <h1 className="font-serif text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-3 text-sm text-muted">
          Same account works on the web and the iOS app.
        </p>
        <LoginForm />
        <p className="mt-4 text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="content-link font-medium">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  );
}
