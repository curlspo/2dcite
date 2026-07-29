"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LAW_SCHOOL_NOT_LISTED,
  LAW_SCHOOL_OPTIONS,
  STUDENT_CREDENTIAL_REVIEW_HOURS,
  STUDENT_CREDENTIAL_TURNAROUND_COPY,
} from "@2dcite/shared";
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

/** Parse stored value like "Not listed — Other School" back into form state */
function parseInitialSchool(stored?: string | null): {
  lawSchool: string;
  lawSchoolOther: string;
} {
  if (!stored) return { lawSchool: "", lawSchoolOther: "" };
  if (stored === LAW_SCHOOL_NOT_LISTED) {
    return { lawSchool: LAW_SCHOOL_NOT_LISTED, lawSchoolOther: "" };
  }
  if (stored.startsWith(`${LAW_SCHOOL_NOT_LISTED} — `)) {
    return {
      lawSchool: LAW_SCHOOL_NOT_LISTED,
      lawSchoolOther: stored.slice(`${LAW_SCHOOL_NOT_LISTED} — `.length),
    };
  }
  if (LAW_SCHOOL_OPTIONS.includes(stored)) {
    return { lawSchool: stored, lawSchoolOther: "" };
  }
  // Legacy free-text school → treat as not listed with the prior name
  return { lawSchool: LAW_SCHOOL_NOT_LISTED, lawSchoolOther: stored };
}

export function StudentApplicationForm({ initial }: Props) {
  const router = useRouter();
  const parsed = useMemo(
    () => parseInitialSchool(initial?.lawSchool),
    [initial?.lawSchool]
  );
  const [lawSchool, setLawSchool] = useState(parsed.lawSchool);
  const [lawSchoolOther, setLawSchoolOther] = useState(parsed.lawSchoolOther);
  const [year, setYear] = useState(initial?.year || "L2");
  const [professorName, setProfessorName] = useState(
    initial?.professorName || ""
  );
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
  const needsOther = lawSchool === LAW_SCHOOL_NOT_LISTED;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError(null);
    setMessage(null);

    if (!lawSchool) {
      setError("Select your law school from the list.");
      return;
    }
    if (needsOther && lawSchoolOther.trim().length < 2) {
      setError("Enter the name of your law school when selecting Not listed.");
      return;
    }
    if (!legalWritingPassed) {
      setError("You must confirm you passed a legal writing course.");
      return;
    }
    if (!enrollmentFile || !writingFile || !recFile) {
      setError(
        "Upload enrollment proof, legal writing proof, and professor recommendation."
      );
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
          ...(needsOther ? { lawSchoolOther: lawSchoolOther.trim() } : {}),
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
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-5 rounded-lg border border-border bg-card p-6"
    >
      <div
        className="rounded-md border border-border bg-accent-soft/40 px-3 py-3 text-sm text-muted"
        role="note"
      >
        <p className="font-medium text-ink">
          Reviewer credentials · up to {STUDENT_CREDENTIAL_REVIEW_HOURS} hours
        </p>
        <p className="mt-1.5 leading-relaxed">
          {STUDENT_CREDENTIAL_TURNAROUND_COPY}
        </p>
      </div>

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
          {initial.status === "PENDING" && (
            <span className="mt-1 block text-muted">
              Manual review in progress — typically within{" "}
              {STUDENT_CREDENTIAL_REVIEW_HOURS} hours.
            </span>
          )}
        </div>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
          {message}
        </p>
      )}

      <div className="block text-sm">
        <label htmlFor="student-law-school" className="font-medium text-ink">
          Law school
        </label>
        <p id="student-law-school-hint" className="mt-1 text-xs text-muted">
          Select from top U.S. law schools. A .edu address alone does not
          qualify you as a reviewer.
        </p>
        <select
          id="student-law-school"
          name="lawSchool"
          required
          disabled={locked}
          value={lawSchool}
          onChange={(e) => setLawSchool(e.target.value)}
          aria-describedby="student-law-school-hint"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink disabled:opacity-60"
        >
          <option value="">Select law school…</option>
          {LAW_SCHOOL_OPTIONS.map((school) => (
            <option key={school} value={school}>
              {school}
            </option>
          ))}
        </select>
      </div>

      {needsOther && (
        <div className="block text-sm">
          <label
            htmlFor="student-law-school-other"
            className="font-medium text-ink"
          >
            School name (if not listed)
          </label>
          <input
            id="student-law-school-other"
            name="lawSchoolOther"
            required={needsOther}
            disabled={locked}
            value={lawSchoolOther}
            onChange={(e) => setLawSchoolOther(e.target.value)}
            placeholder="Official name of your law school"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-ink disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-muted">
            Applications from schools outside the listed set are reviewed
            case-by-case and may take the full{" "}
            {STUDENT_CREDENTIAL_REVIEW_HOURS}-hour window.
          </p>
        </div>
      )}

      <label className="block text-sm">
        <span className="font-medium text-ink">Year</span>
        <select
          disabled={locked}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 disabled:opacity-60"
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
        <span className="font-medium text-ink">
          Recommending professor — name
        </span>
        <input
          required
          disabled={locked}
          value={professorName}
          onChange={(e) => setProfessorName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 disabled:opacity-60"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Professor email</span>
        <input
          type="email"
          required
          disabled={locked}
          value={professorEmail}
          onChange={(e) => setProfessorEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 disabled:opacity-60"
        />
      </label>

      {!locked && (
        <>
          <label className="block text-sm">
            <span className="font-medium text-ink">
              Enrollment proof (PDF/image)
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              required
              onChange={(e) => setEnrollmentFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">
              Legal writing course proof
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              required
              onChange={(e) => setWritingFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">
              Professor recommendation letter
            </span>
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
            {loading ? "Submitting…" : "Submit for credential review"}
          </button>
          <p className="text-xs text-muted">
            Expect a decision within {STUDENT_CREDENTIAL_REVIEW_HOURS} hours
            after a complete application (documents + school selection).
          </p>
        </>
      )}
    </form>
  );
}
