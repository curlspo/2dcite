"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

export function AssignmentActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/jobs/${jobId}/accept`, { method: "POST" });
      router.push(`/assignments/${jobId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Accept failed");
    } finally {
      setLoading(false);
    }
  }

  async function decline() {
    if (!confirm("Decline this assignment? It will return to the queue.")) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/jobs/${jobId}/decline`, { method: "POST" });
      router.push("/assignments");
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Decline failed");
    } finally {
      setLoading(false);
    }
  }

  if (status !== "ASSIGNED") return null;

  return (
    <div className="mt-4 space-y-2">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger"
        >
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Assignment actions">
        <button
          type="button"
          disabled={loading}
          aria-busy={loading}
          onClick={accept}
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Accept assignment
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={decline}
          className="min-h-11 rounded-md border border-border px-4 py-2 text-sm text-ink disabled:opacity-50"
        >
          Decline assignment
        </button>
      </div>
      <p className="text-xs text-muted">
        Accept within the time window or the job will requeue automatically.
      </p>
    </div>
  );
}
