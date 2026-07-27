"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";
import {
  TurnstileWidget,
  resetTurnstile,
} from "@/components/captcha/TurnstileWidget";

type Props = {
  initial?: {
    lawSchool?: string | null;
    year?: string | null;
    professorName?: string | null;
    professorEmail?: string | null;
    status?: string | null;
    rejectionReason?: string | null;
  };
};

async function uploadFile(file: File, purpose: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);
  return apiFetch<{ key: string }>("/uploads", { method: "POST", body: form });
}

export function StudentApplicationForm({ initial }: Props) {
  const router = useRouter();
  const [lawSchool, setLawSchool] = useState(initial?.lawSchool || "");
  const [year, setYear] = useState(initial?.year || "L2");
  const [professorName, setProfessorName] = useState(initial?.professorName || "");
  const [professorEmail, setProfessorEmail] = useState(
    initial?.professorEmail || ""
  );
  const [legalWritingPassed, setLegalWritingPassed] = useState(false);
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null);
  const [writingFile, setWritingFile] = useState<File | null>(null);
  const [recFile, setRecFile] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locked = initial?.status === "APPROVED";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError(null);
    setMessage(null);

    if (!legalWritingPassed) {
      setError("You must confirm you passed a legal writing course.");
      return;
    }
    if (!enrollmentFile || !writingFile || !recFile) {
      setError("Upload enrollment proof, legal writing proof, and professor recommendation.");
      return;
    }
    if (!captchaToken) {
      setError("Please complete the security check and try again.");
      return;
    }

    setLoading(true);
    try {
      const [enrollment, writing, rec] = await Promise.all([
        uploadFile(enrollmentFile, "student-enrollment"),
        uploadFile(writingFile, "student-writing"),
        uploadFile(recFile, "student-rec"),
      ]);

      const data = await apiFetch<{ message: string }>("/student/application", {
        method: "POST",
        body: JSON.stringify({
          lawSchool,
          year,
          legalWritingCoursePassed: true,
          professorName,
          professorEmail,
          enrollmentProofKey: enrollment.key,
          legalWritingProofKey: writing.key,
          professorRecKey: rec.key,
          captchaToken,
        }),
      });
      setMessage(data.message);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BrowserApiError ? err.message : "Submission failed"
      );
      setCaptchaToken(null);
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-lg border border-border bg-card p-6">
      {initial?.status && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            initial.status === "APPROVED"
              ? "bg-green-50 text-green-900"
              : initial.status === "REJECTED"
                ? "bg-red-50 text-danger"
                : "bg-accent-soft text-ink"
          }`}
        >
          Status: <strong>{initial.status}</strong>
          {initial.rejectionReason ? ` — ${initial.rejectionReason}` : null}
        </div>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
          {message}
        </p>
      )}

      <label className="block text-sm">
        <span className="text-muted">Law school</span>
        <input
          required
          disabled={locked}
          value={lawSchool}
          onChange={(e) => setLawSchool(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 disabled:opacity-60"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Year</span>
        <select
          disabled={locked}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 disabled:opacity-60"
        >
          <option value="L2">2L</option>
          <option value="L3">3L</option>
        </select>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          disabled={locked}
          checked={legalWritingPassed}
          onChange={(e) => setLegalWritingPassed(e.target.checked)}
          className="mt-1"
        />
        <span>
          I have taken and <strong>passed</strong> a legal writing course at an
          accredited law school.
        </span>
      </label>

      <label className="block text-sm">
        <span className="text-muted">Recommending professor — name</span>
        <input
          required
          disabled={locked}
          value={professorName}
          onChange={(e) => setProfessorName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 disabled:opacity-60"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Professor email</span>
        <input
          type="email"
          required
          disabled={locked}
          value={professorEmail}
          onChange={(e) => setProfessorEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 disabled:opacity-60"
        />
      </label>

      {!locked && (
        <>
          <label className="block text-sm">
            <span className="text-muted">Enrollment proof (PDF/image)</span>
            <input
              type="file"
              accept=".pdf,image/*"
              required
              onChange={(e) => setEnrollmentFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Legal writing course proof</span>
            <input
              type="file"
              accept=".pdf,image/*"
              required
              onChange={(e) => setWritingFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Professor recommendation letter</span>
            <input
              type="file"
              accept=".pdf,image/*"
              required
              onChange={(e) => setRecFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
        </>
      )}

      {!locked && (
        <>
          <TurnstileWidget onToken={setCaptchaToken} />
          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="btn-primary"
            style={{ color: "#ffffff", backgroundColor: "#16325c" }}
          >
            {loading ? "Submitting…" : "Submit for admin review"}
          </button>
        </>
      )}
    </form>
  );
}
