"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CitationFindingCode,
  DISCLAIMER_COPY_VERSION,
  ReviewScope,
  STUDENT_NO_AI_ATTESTATION,
  STUDENT_NO_AI_POLICY,
  STUDENT_REVIEW_ATTESTATION,
} from "@2dcite/shared";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

type Finding = {
  citationText: string;
  code: string;
  notes: string;
};

const EXISTENCE_CODES = [
  {
    value: CitationFindingCode.ACCURATE,
    label: "Authority exists / correctly identified",
  },
  {
    value: CitationFindingCode.NEEDS_ATTENTION,
    label: "Existence unclear — needs attention",
  },
  {
    value: CitationFindingCode.DOES_NOT_SUPPORT,
    label: "Authority not found / does not appear to exist as cited",
  },
  { value: CitationFindingCode.FORMAT_ISSUE, label: "Format / citation form issue" },
];

const PROPOSITION_CODES = [
  {
    value: CitationFindingCode.ACCURATE,
    label: "Accurate / supports proposition",
  },
  { value: CitationFindingCode.NEEDS_ATTENTION, label: "Needs attention" },
  {
    value: CitationFindingCode.DOES_NOT_SUPPORT,
    label: "Does not support proposition",
  },
  { value: CitationFindingCode.FORMAT_ISSUE, label: "Format issue" },
];

export function ReviewForm({
  jobId,
  reviewScope = "EXISTENCE_ONLY",
}: {
  jobId: string;
  reviewScope?: string;
}) {
  const router = useRouter();
  const errorId = useId();
  const isProposition = reviewScope === ReviewScope.PROPOSITION_SUPPORT;
  const codes = isProposition ? PROPOSITION_CODES : EXISTENCE_CODES;

  const [findings, setFindings] = useState<Finding[]>([
    { citationText: "", code: CitationFindingCode.ACCURATE, notes: "" },
  ]);
  const [overallNotes, setOverallNotes] = useState("");
  const [attested, setAttested] = useState(false);
  const [noAi, setNoAi] = useState(false);
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
      setError("You must accept the general attestation.");
      return;
    }
    if (!noAi) {
      setError(
        "You must confirm you did not use generative AI for this review or report."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{
        message: string;
        certificate?: { certNumber: string; downloadPath: string };
      }>(`/jobs/${jobId}/review`, {
        method: "POST",
        body: JSON.stringify({
          findings: findings.map((f) => ({
            citationText: f.citationText || undefined,
            code: f.code,
            notes: f.notes || undefined,
          })),
          overallNotes: overallNotes || undefined,
          attestationAccepted: true as const,
          noAiAttestationAccepted: true as const,
          disclaimerCopyVersion: DISCLAIMER_COPY_VERSION,
          platform: "WEB",
        }),
      });
      setMessage(
        res.certificate
          ? `${res.message} Certificate ${res.certificate.certNumber}.`
          : res.message
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-6"
      aria-describedby={error ? errorId : undefined}
    >
      <div
        className="rounded-lg border border-border bg-accent-soft/40 px-4 py-3 text-sm text-muted"
        role="note"
      >
        <p className="font-medium text-ink">
          Requested scope:{" "}
          {isProposition
            ? "Existence + whether authorities support asserted propositions"
            : "Existence / identification of cited authorities only"}
        </p>
        <p className="mt-1.5 leading-relaxed">{STUDENT_NO_AI_POLICY}</p>
        {!isProposition && (
          <p className="mt-1.5 leading-relaxed">
            Do not evaluate or opine on whether authorities support the legal
            propositions—only whether they exist and are correctly cited as
            requested.
          </p>
        )}
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="rounded-md border border-green-700/20 bg-green-50 px-3 py-2 text-sm text-green-900"
        >
          {message}
        </div>
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
                  {codes.map((c) => (
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

      <label className="flex gap-2 rounded-lg border border-danger/30 bg-red-50/50 p-4 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-1"
          checked={noAi}
          onChange={(e) => setNoAi(e.target.checked)}
          required
        />
        <span>
          <span className="font-medium text-ink">
            No generative AI (required)
          </span>
          <br />
          {STUDENT_NO_AI_ATTESTATION}
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !attested || !noAi}
        aria-busy={loading}
        className="btn-primary"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
