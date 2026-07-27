"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";
import {
  TurnstileWidget,
  resetTurnstile,
} from "@/components/captcha/TurnstileWidget";

type MeUser = {
  id: string;
  role: string;
  studentStatus?: string | null;
  mfaSetupRequired?: boolean;
};

function dashboardPath(user: MeUser) {
  if (user.role === "ADMIN") {
    if (user.mfaSetupRequired) return "/admin/mfa";
    return "/admin";
  }
  if (user.role === "STUDENT") {
    if (user.studentStatus === "APPROVED") return "/dashboard";
    return "/onboarding/student";
  }
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShowRecovery(false);

    // Captcha required on password step only (server skips when mfaCode present)
    if (!mfaRequired && !captchaToken) {
      setError("Please complete the security check and try again.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{
        user?: MeUser;
        mfaRequired?: boolean;
        mfaSetupRequired?: boolean;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          ...(mfaRequired && mfaCode ? { mfaCode } : {}),
          ...(!mfaRequired && captchaToken ? { captchaToken } : {}),
        }),
      });

      if (data.mfaRequired) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Unable to complete this request.");
        return;
      }

      router.push(dashboardPath(data.user));
      router.refresh();
    } catch (err) {
      const status = err instanceof BrowserApiError ? err.status : 0;
      // Wrong password / unknown account / MFA fail — offer recovery
      if (status === 401 && !mfaRequired) {
        setError(
          "That email and password combination is not recognized."
        );
        setShowRecovery(true);
      } else {
        setError(
          err instanceof BrowserApiError ? err.message : "Sign in failed"
        );
        if (status === 401) setShowRecovery(true);
      }
      if (!mfaRequired) {
        setCaptchaToken(null);
        resetTurnstile();
      }
    } finally {
      setLoading(false);
    }
  }

  const forgotHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
    : "/forgot-password";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6"
      noValidate={false}
      aria-describedby={error ? errorId : undefined}
    >
      {error && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger"
        >
          <p>{error}</p>
          {showRecovery && (
            <p className="mt-3 text-ink">
              Forgot your password?{" "}
              <Link
                href={forgotHref}
                className="font-semibold text-accent underline underline-offset-2"
              >
                Recover your password
              </Link>
            </p>
          )}
        </div>
      )}
      <div className="block text-sm">
        <label htmlFor="login-email" className="font-medium text-ink">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mfaRequired}
          aria-invalid={error ? true : undefined}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink disabled:opacity-60"
        />
      </div>
      <div className="block text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="login-password" className="font-medium text-ink">
            Password
          </label>
          <Link
            href={forgotHref}
            className="text-xs font-medium text-accent underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={mfaRequired}
          aria-invalid={error ? true : undefined}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink disabled:opacity-60"
        />
      </div>
      {mfaRequired && (
        <div className="block text-sm">
          <label htmlFor="login-mfa" className="font-medium text-ink">
            Authenticator code
          </label>
          <input
            id="login-mfa"
            type="text"
            name="mfa"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="6-digit code or backup code"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
          />
          <p className="mt-1 text-xs text-muted">
            Enter the code from your authenticator app, or a one-time backup
            code.
          </p>
        </div>
      )}
      {!mfaRequired && <TurnstileWidget onToken={setCaptchaToken} />}
      <button
        type="submit"
        disabled={loading || (!mfaRequired && !captchaToken)}
        aria-busy={loading}
        className="btn-primary w-full"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        {loading
          ? "Signing in…"
          : mfaRequired
            ? "Verify and sign in"
            : "Sign in"}
      </button>
    </form>
  );
}
