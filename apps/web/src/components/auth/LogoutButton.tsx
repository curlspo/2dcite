"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-browser";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="text-sm text-muted hover:text-ink"
    >
      Sign out
    </button>
  );
}
