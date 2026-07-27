"use client";

import { useState } from "react";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

export function AdminMfaPanel({
  mfaEnabled,
  mfaVerified,
}: {
  mfaEnabled: boolean;
  mfaVerified: boolean;
}) {
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ secret: string; otpauthUrl: string }>(
        "/admin/mfa/setup",
        { method: "GET" }
      );
      setSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ backupCodes: string[]; message: string }>(
        "/admin/mfa/setup",
        {
          method: "POST",
          body: JSON.stringify({ code }),
        }
      );
      setBackupCodes(res.backupCodes);
      setMessage(res.message);
      setSecret(null);
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Confirm failed");
    } finally {
      setLoading(false);
    }
  }

  async function stepUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/admin/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code, stepUp: true }),
      });
      setMessage("Step-up verified for the next 15 minutes.");
      setCode("");
    } catch (err) {
      setError(
        err instanceof BrowserApiError ? err.message : "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg space-y-6">
      {error && (
        <p className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {message}
        </p>
      )}

      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted">
        <p className="font-medium text-ink">Status</p>
        <p className="mt-2">
          MFA:{" "}
          <strong className="text-ink">
            {mfaEnabled ? "Enabled" : "Not enabled"}
          </strong>
        </p>
        <p className="mt-1">
          Session MFA:{" "}
          <strong className="text-ink">
            {mfaVerified ? "Verified" : "Pending"}
          </strong>
        </p>
      </div>

      {!mfaEnabled && !backupCodes && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-ink">Set up authenticator</p>
          <p className="mt-2 text-sm text-muted">
            Use Google Authenticator, 1Password, Authy, or similar. Scan or
            enter the secret, then confirm with a 6-digit code.
          </p>
          {!secret ? (
            <button
              type="button"
              onClick={startSetup}
              disabled={loading}
              className="btn-primary mt-4"
              style={{ color: "#ffffff", backgroundColor: "#16325c" }}
            >
              {loading ? "Starting…" : "Generate secret"}
            </button>
          ) : (
            <form onSubmit={confirmSetup} className="mt-4 space-y-3">
              <p className="break-all rounded-md bg-surface-muted px-3 py-2 font-mono text-xs text-ink">
                {secret}
              </p>
              {otpauthUrl && (
                <p className="break-all text-xs text-muted">
                  otpauth: {otpauthUrl}
                </p>
              )}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ color: "#ffffff", backgroundColor: "#16325c" }}
              >
                {loading ? "Confirming…" : "Enable MFA"}
              </button>
            </form>
          )}
        </div>
      )}

      {backupCodes && (
        <div className="rounded-xl border border-gold/40 bg-accent-soft/40 p-5">
          <p className="font-medium text-ink">Backup codes (save now)</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-ink">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Each code works once. Store offline; they will not be shown again.
          </p>
        </div>
      )}

      {mfaEnabled && (
        <form
          onSubmit={stepUp}
          className="rounded-xl border border-border bg-card p-5 space-y-3"
        >
          <p className="text-sm font-medium text-ink">Step-up verification</p>
          <p className="text-sm text-muted">
            Re-enter a TOTP code before approve/reject/reassign (valid 15
            minutes).
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ color: "#ffffff", backgroundColor: "#16325c" }}
          >
            {loading ? "Verifying…" : "Verify step-up"}
          </button>
        </form>
      )}
    </div>
  );
}
