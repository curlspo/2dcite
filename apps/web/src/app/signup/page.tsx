import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Create an account
        </h1>
        <p className="mt-3 text-sm text-muted">
          Choose your role. Students must complete eligibility verification
          before receiving assignments. Full registration ships in Phase 1.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            {
              role: "Attorney",
              desc: "Submit briefs for independent citation review",
            },
            {
              role: "Judge",
              desc: "Submit orders or drafts for independent citation review",
            },
            {
              role: "Law student (2L/3L)",
              desc: "Apply with proof of enrollment, legal writing, and professor recommendation",
            },
          ].map((item) => (
            <div
              key={item.role}
              className="rounded-lg border border-border bg-card p-4 opacity-80"
            >
              <p className="font-medium text-ink">{item.role}</p>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
