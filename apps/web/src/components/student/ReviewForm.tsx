"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CitationFindingCode,
  DISCLAIMER_COPY_VERSION,
  STUDENT_REVIEW_ATTESTATION,
} from "@2dcite/shared";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

type Finding = {
  citationText: string;
  code: string;
  notes: string;
};

const CODES = [
  { value: CitationFindingCode.ACCURATE, label: "Accurate / supports proposition" },
  { value: CitationFindingCode.NEEDS_ATTENTION, label: "Needs attention" },
  {
    value: CitationFindingCode.DOES_NOT_SUPPORT,
    label: "Does not support proposition",
  },
  { value: CitationFindingCode.FORMAT_ISSUE, label: "Format issue" },
];

export function ReviewForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [findings, setFindings] = useState<Finding[]>([
    { citationText: "", code: CitationFindingCode.ACCURATE, notes: "" },
  ]);
  const [overallNotes, setOverallNotes] = useState("");
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateFinding(i: number, patch: Partial<Finding>) {
    setFindings((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!attested) {
      setError("You must accept the attestation.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>(`/jobs/${jobId}/review`, {
        method: "POST",
        body: JSON.stringify({
          findings: findings.map((f) => ({
            citationText: f.citationText || undefined,
            code: f.code,
            notes: f.notes || undefined,
          })),
          overallNotes: overallNotes || undefined,
          attestationAccepted: true as const,
          disclaimerCopyVersion: DISCLAIMER_COPY_VERSION,
          platform: "WEB",
        }),
      });
      setMessage(res.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
          {message}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-ink">Citation findings</h3>
          <button
            type="button"
            className="text-sm text-accent underline"
            onClick={() =>
              setFindings((f) => [
                ...f,
                {
                  citationText: "",
                  code: CitationFindingCode.ACCURATE,
                  notes: "",
                },
              ])
            }
          >
            + Add finding
          </button>
        </div>
        <ul className="mt-3 space-y-4">
          {findings.map((f, i) => (
            <li
              key={i}
              className="space-y-2 rounded-lg border border-border bg-card p-4"
            >
              <label className="block text-sm">
                <span className="text-muted">Citation / pin cite (optional)</span>
                <input
                  value={f.citationText}
                  onChange={(e) =>
                    updateFinding(i, { citationText: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  placeholder="e.g. Smith v. Jones, 123 U.S. 45 (2020)"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Finding</span>
                <select
                  value={f.code}
                  onChange={(e) => updateFinding(i, { code: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                >
                  {CODES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted">Notes (informational only)</span>
                <textarea
                  value={f.notes}
                  onChange={(e) => updateFinding(i, { notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                />
              </label>
              {findings.length > 1 && (
                <button
                  type="button"
                  className="text-xs text-danger"
                  onClick={() =>
                    setFindings((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <label className="block text-sm">
        <span className="text-muted">Overall notes (optional)</span>
        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2"
        />
      </label>

      <label className="flex gap-2 rounded-lg border border-border bg-accent-soft/50 p-4 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-1"
          checked={attested}
          onChange={(e) => setAttested(e.target.checked)}
        />
        <span>
          <span className="font-medium text-ink">Required attestation</span>
          <br />
          {STUDENT_REVIEW_ATTESTATION}
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !attested}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
