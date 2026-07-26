"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

export type AdminStudentRow = {
  id: string;
  name: string;
  email: string;
  lawSchool: string;
  year: string;
  status: string;
  professorName: string | null;
  professorEmail: string | null;
  applicationComplete: boolean;
  rejectionReason: string | null;
};

export function StudentReviewList({
  initial,
}: {
  initial: AdminStudentRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = rows.filter((r) =>
    filter === "ALL" ? true : r.status === filter
  );

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/admin/students/${id}/approve`, { method: "POST" });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt(
      "Rejection reason (shown to student):",
      "Application did not meet eligibility requirements."
    );
    if (reason === null) return;
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/admin/students/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "REJECTED", rejectionReason: reason }
            : r
        )
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof BrowserApiError ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 ${
              filter === f
                ? "bg-accent text-white"
                : "border border-border bg-card text-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {visible.length === 0 ? (
        <p className="text-sm text-muted">No students in this filter.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {s.name}{" "}
                    <span className="text-xs font-normal uppercase text-gold">
                      {s.status}
                    </span>
                  </p>
                  <p className="text-sm text-muted">{s.email}</p>
                  <p className="mt-2 text-sm text-muted">
                    {s.lawSchool || "(school not set)"} · {s.year}
                  </p>
                  <p className="text-sm text-muted">
                    Professor: {s.professorName || "—"} ({s.professorEmail || "—"})
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Application complete: {s.applicationComplete ? "yes" : "no"}
                  </p>
                  {s.rejectionReason && (
                    <p className="mt-1 text-sm text-danger">{s.rejectionReason}</p>
                  )}
                </div>
                {s.status === "PENDING" && s.applicationComplete && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => approve(s.id)}
                      className="rounded-md bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => reject(s.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-ink disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
