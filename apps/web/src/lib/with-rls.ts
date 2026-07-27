import {
  enterBypassRls,
  enterUserRls,
} from "@2dcite/db";
import type { SessionUser } from "@/lib/session";
import {
  requireSession,
  requireUser,
  type SessionContext,
} from "@/lib/session";

/**
 * Run work as the authenticated user under PostgreSQL RLS.
 */
export async function withUserRlsFromRequest<T>(
  request: Request,
  fn: (user: SessionUser) => Promise<T>
): Promise<T> {
  const user = await requireUser(request);
  return enterUserRls(user, () => fn(user));
}

export async function withSessionRlsFromRequest<T>(
  request: Request,
  fn: (ctx: SessionContext) => Promise<T>
): Promise<T> {
  const ctx = await requireSession(request);
  return enterUserRls(ctx.user, () => fn(ctx));
}

/** System paths: matching, webhooks, auth credential lookup */
export function withBypassRls<T>(fn: () => Promise<T>): Promise<T> {
  return enterBypassRls(fn);
}
