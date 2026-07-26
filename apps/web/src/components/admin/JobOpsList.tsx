"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

export type AdminJobRow = {
  id: string;
  title: string;
  status: string;
  turnaroundTier: string;
  clientName: string;
  studentName: string | null;
  grossFeeDisplay: string;
  payoutStatus: string | null;
  createdAt: string;
};

export function JobOpsList({ initial }: { initial: AdminJobRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reassign(id: string) {
    const reason = window.prompt(
      "Reason for reassignment (optional):",
      "Stuck assignment"
    );
    if (reason === null) return;
    setBusy(id);
    setError(null);
    try {
      const res = await apiFetch<{ status: string; newStudentId: string | null }>(
        `/admin/jobs/${id}/reassign`,
        {
          method: "POST",
          body: JSON.stringify({ reason: reason || undefined }),
        }
      );
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: res.status,
                studentName: res.newStudentId ? "(reassigned)" : null,
              }
            : r
        )
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Reassign failed");
    } finally {
      setBusy(null);
    }
  }

  async function runMatching() {
    setBusy("match");
    setError(null);
    try {
      await apiFetch("/matching/run", { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Match failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runMatching}
          disabled={busy === "match"}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
        >
          Run matching queue
        </button>
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No jobs yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map((j) => (
            <li
              key={j.id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-4"
            >
              <div>
                <p className="font-medium text-ink">{j.title}</p>
                <p className="text-xs text-muted">
                  {j.status} · {j.turnaroundTier} · {j.grossFeeDisplay}
                  {j.payoutStatus ? ` · payout ${j.payoutStatus}` : ""}
                </p>
                <p className="text-xs text-muted">
                  Client: {j.clientName}
                  {j.studentName ? ` · Student: ${j.studentName}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {new Date(j.createdAt).toLocaleString()}
                </p>
              </div>
              {["QUEUED", "ASSIGNED", "IN_REVIEW"].includes(j.status) && (
                <button
                  type="button"
                  disabled={busy === j.id}
                  onClick={() => reassign(j.id)}
                  className="rounded-md bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  Reassign
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
