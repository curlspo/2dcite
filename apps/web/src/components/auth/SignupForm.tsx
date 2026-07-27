"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { isEduEmail } from "@2dcite/shared";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

const ROLES = [
  {
    value: "ATTORNEY",
    label: "Attorney",
    desc: "Submit briefs for citation review — bar number required",
  },
  {
    value: "JUDGE",
    label: "Judge",
    desc: "Submit orders for citation review — license/bar number required",
  },
  {
    value: "STUDENT",
    label: "Law student (2L/3L)",
    desc: "Apply to review citations — .edu email required",
  },
] as const;

export function SignupForm({
  initialRole = "ATTORNEY",
}: {
  initialRole?: string;
}) {
  const router = useRouter();
  const errorId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [role, setRole] = useState<string>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsBar = role === "ATTORNEY" || role === "JUDGE";
  const needsEdu = role === "STUDENT";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsEdu && !isEduEmail(email.trim())) {
      setError(
        "Student accounts require a .edu email address from an accredited law school."
      );
      return;
    }
    if (needsBar && !barNumber.trim()) {
      setError(
        "Attorneys and judges must provide a state bar or judicial license number."
      );
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ user: { role: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          ...(needsBar ? { barNumber: barNumber.trim() } : {}),
        }),
      });
      if (data.user.role === "STUDENT") {
        router.push("/onboarding/student");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BrowserApiError ? err.message : "Sign up failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6"
      aria-describedby={error ? errorId : undefined}
    >
      {error && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger"
        >
          {error}
        </div>
      )}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">I am a…</legend>
        {ROLES.map((r) => (
          <label
            key={r.value}
            className={`flex min-h-11 cursor-pointer gap-3 rounded-md border p-3 ${
              role === r.value
                ? "border-accent bg-accent-soft"
                : "border-border"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.value}
              checked={role === r.value}
              onChange={() => setRole(r.value)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-medium text-ink">{r.label}</span>
              <span className="text-sm text-muted">{r.desc}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="block text-sm">
        <label htmlFor="signup-name" className="font-medium text-ink">
          Full name
        </label>
        <input
          id="signup-name"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
        />
      </div>
      <div className="block text-sm">
        <label htmlFor="signup-email" className="font-medium text-ink">
          Email{needsEdu ? " (.edu required)" : ""}
        </label>
        <input
          id="signup-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={needsEdu ? "you@lawschool.edu" : "you@firm.com"}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
          aria-describedby={needsEdu ? "signup-email-hint" : undefined}
        />
        {needsEdu && (
          <p id="signup-email-hint" className="mt-1 text-xs text-muted">
            Students must register with a school-issued .edu address.
          </p>
        )}
      </div>
      {needsBar && (
        <div className="block text-sm">
          <label htmlFor="signup-bar" className="font-medium text-ink">
            {role === "JUDGE"
              ? "Judicial license / bar number"
              : "State bar number"}
          </label>
          <input
            id="signup-bar"
            name="barNumber"
            required
            autoComplete="off"
            value={barNumber}
            onChange={(e) => setBarNumber(e.target.value)}
            placeholder={
              role === "JUDGE" ? "License or bar number" : "e.g. 123456"
            }
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
            aria-describedby="signup-bar-hint"
          />
          <p id="signup-bar-hint" className="mt-1 text-xs text-muted">
            Required to create an attorney or judge account. Used to reduce
            spam and verify professional status.
          </p>
        </div>
      )}
      <div className="block text-sm">
        <label htmlFor="signup-password" className="font-medium text-ink">
          Password (min 10 characters)
        </label>
        <input
          id="signup-password"
          type="password"
          name="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="signup-password-hint"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
        />
        <p id="signup-password-hint" className="mt-1 text-xs text-muted">
          Use at least 10 characters.
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="btn-primary w-full"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
