"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CLIENT_SUBMIT_ACKNOWLEDGMENTS,
  DISCLAIMER_COPY_VERSION,
  FUNDS_HOLD_COPY,
  PRICING_DEFAULTS,
  MEMBERSHIP,
  computeClientJobPricing,
} from "@2dcite/shared";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";
import { DisclaimerAckPanel } from "@/components/legal/DisclaimerAckPanel";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

type MembershipPayload = {
  membership: {
    isActive: boolean;
    includedReviewsRemaining: number;
    includedReviewsUsed: number;
    includedReviewsPerMonth: number;
  };
};

export function NewJobForm() {
  const router = useRouter();
  const errorId = useId();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tier, setTier] = useState<"STANDARD_48H" | "RUSH">("STANDARD_48H");
  const [file, setFile] = useState<File | null>(null);
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [disclaimerRead, setDisclaimerRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<MembershipPayload["membership"] | null>(
    null
  );

  useEffect(() => {
    apiFetch<MembershipPayload>("/membership/checkout")
      .then((res) => setMember(res.membership))
      .catch(() => setMember(null));
  }, []);

  const fees = useMemo(() => {
    const isRush = tier === "RUSH";
    return computeClientJobPricing({
      isRush,
      isActiveMember: Boolean(member?.isActive),
      includedReviewsRemaining: member?.includedReviewsRemaining ?? 0,
    });
  }, [tier, member]);

  const allAcked =
    disclaimerRead &&
    CLIENT_SUBMIT_ACKNOWLEDGMENTS.every((a) => acks[a.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Upload a PDF of the brief or order (or table of authorities).");
      return;
    }
    if (!disclaimerRead) {
      setError(
        "You must confirm that you have read and understand the full disclaimer."
      );
      return;
    }
    if (!CLIENT_SUBMIT_ACKNOWLEDGMENTS.every((a) => acks[a.id])) {
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

      // membership_included, dev_mock, etc.
      router.push(`/jobs/${created.job.id}?paid=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  const submitLabel =
    fees.mode === "MEMBERSHIP_INCLUDED"
      ? "Use included membership review"
      : fees.grossCents === 0
        ? "Submit"
        : `Pay ${formatUsd(fees.grossCents)} & submit`;

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

      {member?.isActive && (
        <div className="rounded-lg border border-accent/30 bg-accent-soft/50 px-4 py-3 text-sm text-muted">
          <p className="font-medium text-ink">Membership active</p>
          <p className="mt-1">
            {member.includedReviewsRemaining > 0
              ? `${member.includedReviewsRemaining} included review remaining this period — applied automatically.`
              : `Included allotment used. Additional reviews are ${MEMBERSHIP.additionalReviewDiscountBps / 100}% off list price.`}
          </p>
        </div>
      )}

      {!member?.isActive && member !== null && (
        <p className="text-sm text-muted">
          Want 1 included review/month + 10% off extras?{" "}
          <Link href="/membership" className="text-accent underline">
            View membership
          </Link>
        </p>
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
        {(
          [
            {
              id: "STANDARD_48H" as const,
              label: "Standard",
              hours: PRICING_DEFAULTS.standardSlaHours,
              note: "hours after student accepts",
              isRush: false,
            },
            {
              id: "RUSH" as const,
              label: "Rush",
              hours: PRICING_DEFAULTS.rushSlaHours,
              note: "hours after student accepts · priority queue",
              isRush: true,
            },
          ] as const
        ).map((opt) => {
          const p = computeClientJobPricing({
            isRush: opt.isRush,
            isActiveMember: Boolean(member?.isActive),
            includedReviewsRemaining: member?.includedReviewsRemaining ?? 0,
          });
          return (
            <label
              key={opt.id}
              className={`flex min-h-11 cursor-pointer justify-between rounded-xl border p-3 ${
                tier === opt.id
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-card"
              }`}
            >
              <span className="flex gap-2">
                <input
                  type="radio"
                  name="tier"
                  checked={tier === opt.id}
                  onChange={() => setTier(opt.id)}
                />
                <span>
                  <span className="font-medium text-ink">{opt.label}</span>
                  <span className="block text-xs text-muted">
                    {opt.hours} {opt.note}
                  </span>
                </span>
              </span>
              <span className="text-right font-medium text-ink">
                {p.mode === "MEMBERSHIP_INCLUDED" ? (
                  <>
                    <span className="block text-xs font-normal text-muted line-through">
                      {formatUsd(p.listGrossCents)}
                    </span>
                    Included
                  </>
                ) : p.mode === "MEMBERSHIP_DISCOUNT" ? (
                  <>
                    <span className="block text-xs font-normal text-muted line-through">
                      {formatUsd(p.listGrossCents)}
                    </span>
                    {formatUsd(p.grossCents)}
                  </>
                ) : (
                  formatUsd(p.grossCents)
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="block text-sm">
        <label htmlFor="job-pdf" className="font-medium text-ink">
          PDF upload (max ~{PRICING_DEFAULTS.maxPages} pages recommended)
        </label>
        <p id="job-pdf-hint" className="mt-1 text-xs text-muted">
          Full brief/order or{" "}
          <strong className="font-medium text-ink">table of authorities</strong>{" "}
          only. Before or after filing / order issuance. 2dcite takes no
          responsibility for confidential materials you upload.
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

      <DisclaimerAckPanel
        checked={disclaimerRead}
        onCheckedChange={setDisclaimerRead}
      />

      <fieldset className="rounded-xl border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium text-ink">
          Specific acknowledgments
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

      <div className="rounded-xl border border-gold/30 bg-accent-soft/40 p-4 text-sm text-muted">
        <p className="font-medium text-ink">Payment & hold</p>
        {fees.mode === "MEMBERSHIP_INCLUDED" ? (
          <p className="mt-1">
            This review uses your included membership allotment — no charge to
            your card. The student share is still funded by the platform and
            held until the Certificate is issued.
          </p>
        ) : (
          <>
            <p className="mt-1">{FUNDS_HOLD_COPY.clientPayOnUpload}</p>
            <p className="mt-1">{FUNDS_HOLD_COPY.releaseOnCertificate}</p>
            <p className="mt-1">
              {FUNDS_HOLD_COPY.chargedOnSubmitRefundIfUnfulfilled}
            </p>
          </>
        )}
        <p className="mt-3 text-ink">
          Total due now: <strong>{formatUsd(fees.grossCents)}</strong>
          {fees.mode !== "LIST" && fees.listGrossCents > fees.grossCents && (
            <span className="ml-2 text-sm font-normal text-muted line-through">
              {formatUsd(fees.listGrossCents)}
            </span>
          )}
          {fees.mode === "MEMBERSHIP_DISCOUNT" && (
            <span className="ml-2 text-sm font-normal text-muted">
              (member 10% off)
            </span>
          )}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !allAcked}
        aria-busy={loading}
        className="btn-primary w-full sm:w-auto"
        style={{ color: "#ffffff", backgroundColor: "#16325c" }}
      >
        {loading ? "Processing…" : submitLabel}
      </button>
    </form>
  );
}
