"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

const ROLES = [
  { value: "ATTORNEY", label: "Attorney", desc: "Submit briefs for citation review" },
  { value: "JUDGE", label: "Judge", desc: "Submit orders for citation review" },
  { value: "STUDENT", label: "Law student (2L/3L)", desc: "Apply to review citations" },
] as const;

export function SignupForm({
  initialRole = "ATTORNEY",
}: {
  initialRole?: string;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ user: { role: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      if (data.user.role === "STUDENT") {
        router.push("/onboarding/student");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BrowserApiError ? err.message : "Sign up failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">I am a…</legend>
        {ROLES.map((r) => (
          <label
            key={r.value}
            className={`flex cursor-pointer gap-3 rounded-md border p-3 ${
              role === r.value ? "border-accent bg-accent-soft" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.value}
              checked={role === r.value}
              onChange={() => setRole(r.value)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-ink">{r.label}</span>
              <span className="text-sm text-muted">{r.desc}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="block text-sm">
        <span className="text-muted">Full name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Password (min 10 characters)</span>
        <input
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-ink"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
