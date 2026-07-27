"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";
import {
  TurnstileWidget,
  resetTurnstile,
} from "@/components/captcha/TurnstileWidget";

export function ForgotPasswordForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const errorId = useId();
  const [email, setEmail] = useState(initialEmail);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!captchaToken) {
      setError("Please complete the security check and try again.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), captchaToken }),
      });
      setMessage(
        res.message ||
          "If an account exists for that email, we sent password recovery instructions."
      );
      setDone(true);
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
        className="mt-8 rounded-lg border border-border bg-card p-6 text-sm text-muted"
        role="status"
      >
        <p className="font-medium text-ink">Check your email</p>
        <p className="mt-2">{message}</p>
        <p className="mt-4">
          <Link href="/login" className="content-link font-medium">
            Return to sign in
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
        </div>
      )}
      <div className="block text-sm">
        <label htmlFor="forgot-email" className="font-medium text-ink">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {loading ? "Sending…" : "Send recovery link"}
      </button>
    </form>
  );
}
