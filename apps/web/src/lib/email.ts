import "server-only";
/**
 * Outbound email (optional Resend). Without RESEND_API_KEY, logs in non-prod.
 */

import { SUPPORT_EMAIL } from "@2dcite/shared";

const FROM =
  process.env.EMAIL_FROM?.trim() ||
  `2dcite <${SUPPORT_EMAIL}>`;

export type SendEmailResult =
  | { ok: true; mode: "resend" | "log" }
  | { ok: false; error: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [opts.to],
          subject: opts.subject,
          text: opts.text,
          html: opts.html ?? undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[email] Resend failed", res.status, body.slice(0, 200));
        return { ok: false, error: "send_failed" };
      }
      return { ok: true, mode: "resend" };
    } catch (e) {
      console.error("[email] Resend error", e);
      return { ok: false, error: "send_failed" };
    }
  }

  // Dev / no provider: log only (never in a way that exposes tokens in HTTP)
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (!isProd) {
    console.info("[email:dev]", {
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return { ok: true, mode: "log" };
  }

  console.error("[email] RESEND_API_KEY not set — cannot send mail in production");
  return { ok: false, error: "not_configured" };
}

export function passwordResetEmail(opts: {
  name: string;
  resetUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = "Reset your 2dcite password";
  const text = [
    `Hello ${opts.name},`,
    "",
    "We received a request to reset your 2dcite password.",
    "Open this link within 1 hour to choose a new password:",
    opts.resetUrl,
    "",
    "If you did not request this, you can ignore this email. Your password will stay the same.",
    "",
    `— 2dcite (${SUPPORT_EMAIL})`,
  ].join("\n");

  const html = `
    <p>Hello ${escapeHtml(opts.name)},</p>
    <p>We received a request to reset your 2dcite password.</p>
    <p><a href="${escapeHtml(opts.resetUrl)}">Reset your password</a></p>
    <p style="color:#555;font-size:14px">This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
    <p style="color:#555;font-size:14px">— 2dcite</p>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
