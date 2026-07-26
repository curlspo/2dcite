"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

export function PayJobButton({
  jobId,
  amountDisplay,
}: {
  jobId: string;
  amountDisplay: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        mode: string;
        url?: string;
      }>(`/jobs/${jobId}/checkout`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (res.mode === "stripe" && res.url) {
        window.location.href = res.url;
        return;
      }
      router.push(`/jobs/${jobId}?paid=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Processing…" : `Pay ${amountDisplay}`}
      </button>
    </div>
  );
}
