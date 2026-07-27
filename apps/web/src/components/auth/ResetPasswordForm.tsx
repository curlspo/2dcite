"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";
import {
  TurnstileWidget,
  resetTurnstile,
} from "@/components/captcha/TurnstileWidget";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const errorId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!captchaToken) {
      setError("Please complete the security check and try again.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password, captchaToken }),
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof BrowserApiError
          ? err.message
          : "Unable to complete this request."
      );
      setCaptchaToken(null);
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-sm text-green-900"
        role="status"
      >
        <p className="font-medium">Password updated</p>
        <p className="mt-2">
          Redirecting you to sign in…{" "}
          <Link href="/login" className="font-medium underline">
            Sign in now
          </Link>
        </p>
      </div>
    );
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
          {/invalid|expired/i.test(error) && (
            <p className="mt-2">
              <Link
                href="/forgot-password"
                className="font-medium text-accent underline"
              >
                Request a new recovery link
              </Link>
            </p>
          )}
        </div>
      )}
      <div className="block text-sm">
        <label htmlFor="reset-password" className="font-medium text-ink">
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          name="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
        />
        <p className="mt-1 text-xs text-muted">At least 10 characters.</p>
      </div>
      <div className="block text-sm">
        <label htmlFor="reset-confirm" className="font-medium text-ink">
          Confirm password
        </label>
        <input
          id="reset-confirm"
          type="password"
          name="confirm"
          required
          minLength={10}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink"
        />
      </div>
      <TurnstileWidget onToken={setCaptchaToken} />
      <button
        type="submit"
        disabled={loading || !captchaToken}
        aria-busy={loading}
        className="btn-primary w-full"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
