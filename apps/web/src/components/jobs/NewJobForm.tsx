"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLIENT_SUBMIT_ACKNOWLEDGMENTS,
  DISCLAIMER_COPY_VERSION,
  FUNDS_HOLD_COPY,
  PRICING_DEFAULTS,
  computeFeeBreakdown,
} from "@2dcite/shared";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function NewJobForm() {
  const router = useRouter();
  const errorId = useId();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tier, setTier] = useState<"STANDARD_48H" | "RUSH">("STANDARD_48H");
  const [file, setFile] = useState<File | null>(null);
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fees = useMemo(
    () => computeFeeBreakdown({ isRush: tier === "RUSH" }),
    [tier]
  );

  const allAcked = CLIENT_SUBMIT_ACKNOWLEDGMENTS.every((a) => acks[a.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Upload a PDF of the brief or order.");
      return;
    }
    if (!allAcked) {
      setError("You must accept all liability acknowledgments.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "job-pdf");
      const upload = await apiFetch<{ key: string }>("/uploads", {
        method: "POST",
        body: form,
      });

      const created = await apiFetch<{ job: { id: string } }>("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          instructions: instructions || undefined,
          turnaroundTier: tier,
          pdfKey: upload.key,
          acknowledgments: {
            copyVersion: DISCLAIMER_COPY_VERSION,
            acceptedIds: CLIENT_SUBMIT_ACKNOWLEDGMENTS.map((a) => a.id),
            platform: "WEB",
          },
        }),
      });

      const checkout = await apiFetch<{
        mode: string;
        url?: string;
        job?: { id: string };
      }>(`/jobs/${created.job.id}/checkout`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (checkout.mode === "stripe" && checkout.url) {
        window.location.href = checkout.url;
        return;
      }

      router.push(`/jobs/${created.job.id}?paid=1`);
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
      className="mt-6 max-w-xl space-y-5"
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
        <label htmlFor="job-title" className="font-medium text-ink">
          Document title
        </label>
        <input
          id="job-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Plaintiff Motion for Summary Judgment"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5"
        />
      </div>

      <div className="block text-sm">
        <label htmlFor="job-instructions" className="font-medium text-ink">
          Instructions for the reviewer (optional)
        </label>
        <textarea
          id="job-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5"
          placeholder="Focus areas, known issues, etc. Not legal advice from the platform."
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Turnaround</legend>
        <label
          className={`flex cursor-pointer justify-between rounded-md border p-3 ${
            tier === "STANDARD_48H" ? "border-accent bg-accent-soft" : "border-border bg-card"
          }`}
        >
          <span className="flex gap-2">
            <input
              type="radio"
              name="tier"
              checked={tier === "STANDARD_48H"}
              onChange={() => setTier("STANDARD_48H")}
            />
            <span>
              <span className="font-medium text-ink">Standard</span>
              <span className="block text-xs text-muted">
                {PRICING_DEFAULTS.standardSlaHours} hours after student accepts
              </span>
            </span>
          </span>
          <span className="font-medium text-ink">
            {formatUsd(computeFeeBreakdown({ isRush: false }).grossCents)}
          </span>
        </label>
        <label
          className={`flex cursor-pointer justify-between rounded-md border p-3 ${
            tier === "RUSH" ? "border-accent bg-accent-soft" : "border-border bg-card"
          }`}
        >
          <span className="flex gap-2">
            <input
              type="radio"
              name="tier"
              checked={tier === "RUSH"}
              onChange={() => setTier("RUSH")}
            />
            <span>
              <span className="font-medium text-ink">Rush</span>
              <span className="block text-xs text-muted">
                {PRICING_DEFAULTS.rushSlaHours} hours after student accepts · priority queue
              </span>
            </span>
          </span>
          <span className="font-medium text-ink">
            {formatUsd(computeFeeBreakdown({ isRush: true }).grossCents)}
          </span>
        </label>
      </fieldset>

      <div className="block text-sm">
        <label htmlFor="job-pdf" className="font-medium text-ink">
          PDF upload (max ~{PRICING_DEFAULTS.maxPages} pages recommended)
        </label>
        <p id="job-pdf-hint" className="mt-1 text-xs text-muted">
          You may upload a full brief or order, or limit the submission to a{" "}
          <strong className="font-medium text-ink">table of authorities</strong>{" "}
          (or similar citation list) to confirm existence and form of cases.
          2dcite takes no responsibility for confidential materials you choose
          to upload.
        </p>
        <input
          id="job-pdf"
          type="file"
          accept="application/pdf,.pdf"
          required
          aria-describedby="job-pdf-hint"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </div>

      <fieldset className="rounded-lg border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium text-ink">
          Liability acknowledgments
        </legend>
        <p className="mt-1 text-xs text-muted">
          Required before payment. Copy version {DISCLAIMER_COPY_VERSION}
        </p>
        <ul className="mt-3 space-y-3">
          {CLIENT_SUBMIT_ACKNOWLEDGMENTS.map((a) => (
            <li key={a.id}>
              <label className="flex min-h-11 gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={Boolean(acks[a.id])}
                  onChange={(e) =>
                    setAcks((prev) => ({ ...prev, [a.id]: e.target.checked }))
                  }
                />
                <span>{a.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="rounded-lg border border-gold/30 bg-accent-soft/40 p-4 text-sm text-muted">
        <p className="font-medium text-ink">Payment & hold</p>
        <p className="mt-1">{FUNDS_HOLD_COPY.clientPayOnUpload}</p>
        <p className="mt-1">{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
        <p className="mt-3 text-ink">
          Total due now: <strong>{formatUsd(fees.grossCents)}</strong>
          <span className="text-muted">
            {" "}
            (platform fee {formatUsd(fees.platformFeeCents)} · student share{" "}
            {formatUsd(fees.studentAmountCents)} held until certificate)
          </span>
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !allAcked}
        aria-busy={loading}
        className="min-h-11 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing…" : `Pay ${formatUsd(fees.grossCents)} & submit`}
      </button>
    </form>
  );
}
