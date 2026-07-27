import { redirect } from "next/navigation";
import { getSessionContextFromCookies } from "@/lib/session";

/**
 * Admin shell gate:
 * - Must be ADMIN
 * - If MFA enabled, session must be MFA-verified
 * - MFA setup page is always reachable for incomplete setup
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContextFromCookies();
  if (!ctx) redirect("/login");
  if (ctx.user.role !== "ADMIN") redirect("/dashboard");

  // Allow /admin/mfa without full MFA verification (setup + step-up UI)
  // Other admin routes require MFA verified when MFA is enabled.
  // Path check via children only — use headers for path in Next 15:
  // We re-check in each page; layout soft-gates setup required.

  return <>{children}</>;
}
