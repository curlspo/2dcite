"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, BrowserApiError } from "@/lib/api-browser";

type MeUser = {
  id: string;
  role: string;
  studentStatus?: string | null;
};

function dashboardPath(user: MeUser) {
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "STUDENT") {
    if (user.studentStatus === "APPROVED") return "/dashboard";
    return "/onboarding/student";
  }
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ user: MeUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push(dashboardPath(data.user));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BrowserApiError ? err.message : "Sign in failed"
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
        <span className="text-muted">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
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
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
