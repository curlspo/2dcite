"use client";

import { useState } from "react";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

export function MembershipCheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ mode: string; url?: string }>(
        "/membership/checkout",
        { method: "POST", body: JSON.stringify({}) }
      );
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setError("Checkout did not return a URL. Try again or contact support.");
    } catch (err) {
      setError(
        err instanceof BrowserApiError
          ? err.message
          : "Could not start membership checkout"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="btn-primary"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        {loading ? "Redirecting to Stripe…" : "Subscribe — $99/month"}
      </button>
    </div>
  );
}
