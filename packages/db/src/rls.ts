/**
 * PostgreSQL Row Level Security context for Prisma.
 *
 * GUC (transaction-local via set_config is_local=true):
 *   app.user_id, app.user_role, app.rls_bypass
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as basePrisma } from "./client";

export type RlsContext =
  | { mode: "user"; userId: string; role: string }
  | { mode: "bypass"; reason?: string }
  | { mode: "deny" };

const als = new AsyncLocalStorage<RlsContext>();

/** Transaction-like client that can run $executeRaw (base or extended). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tx = any;

export function getRlsContext(): RlsContext | undefined {
  return als.getStore();
}

function rlsStrict(): boolean {
  if (process.env.RLS_STRICT === "false") return false;
  if (process.env.RLS_STRICT === "true") return true;
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function resolveContext(): RlsContext {
  const stored = als.getStore();
  if (stored) return stored;
  // No context: system must call enterBypassRls / enterUserRls.
  // Strict (prod): deny-all sentinel. Dev: bypass for ergonomics.
  if (rlsStrict()) return { mode: "deny" };
  return { mode: "bypass", reason: "dev_no_context" };
}

/**
 * Drop privileges to twodcite_app (NOBYPASSRLS) then set identity GUC.
 * Neon neondb_owner has BYPASSRLS=true, so without SET ROLE policies never run.
 */
export async function applyRlsConfig(
  tx: Tx,
  ctx: RlsContext = resolveContext()
): Promise<void> {
  // Must run before queries on this transaction
  try {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE twodcite_app`);
  } catch (e) {
    // Role missing (SQL not applied yet) — log; queries may still bypass on Neon owner
    console.error(
      "[rls] SET LOCAL ROLE twodcite_app failed — run pnpm --filter @2dcite/db rls:apply",
      e instanceof Error ? e.message : e
    );
  }

  if (ctx.mode === "bypass") {
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'on', true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', '', true)`;
    await tx.$executeRaw`SELECT set_config('app.user_role', '', true)`;
    return;
  }
  if (ctx.mode === "deny") {
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'off', true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', ${"__none__"}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_role', ${"NONE"}, true)`;
    return;
  }
  await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'off', true)`;
  await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
  await tx.$executeRaw`SELECT set_config('app.user_role', ${ctx.role}, true)`;
}

export async function runWithRls<T>(
  ctx: RlsContext,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return als.run(ctx, async () => {
    return basePrisma.$transaction(async (tx) => {
      await applyRlsConfig(tx, ctx);
      return fn(tx);
    });
  });
}

export async function runWithUserRls<T>(
  user: { id: string; role: string },
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return runWithRls({ mode: "user", userId: user.id, role: user.role }, fn);
}

export async function runWithBypassRls<T>(
  fn: (tx: Tx) => Promise<T>,
  reason = "system"
): Promise<T> {
  return runWithRls({ mode: "bypass", reason }, fn);
}

export function enterRlsContext<T>(
  ctx: RlsContext,
  fn: () => Promise<T>
): Promise<T> {
  return als.run(ctx, fn);
}

export function enterUserRls<T>(
  user: { id: string; role: string },
  fn: () => Promise<T>
): Promise<T> {
  return enterRlsContext(
    { mode: "user", userId: user.id, role: user.role },
    fn
  );
}

export function enterBypassRls<T>(fn: () => Promise<T>): Promise<T> {
  return enterRlsContext({ mode: "bypass", reason: "system" }, fn);
}

function modelDelegate(tx: Tx, model: string): Record<string, Function> {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  const del = (tx as unknown as Record<string, Record<string, Function>>)[key];
  if (!del) throw new Error(`RLS: unknown model ${model}`);
  return del;
}

export function createRlsPrismaClient(base: PrismaClient = basePrisma) {
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args }) {
          const ctx = resolveContext();
          return base.$transaction(async (tx) => {
            await applyRlsConfig(tx, ctx);
            const del = modelDelegate(tx, model);
            const op = del[operation];
            if (typeof op !== "function") {
              throw new Error(`RLS: ${model}.${operation} missing`);
            }
            return op.call(del, args);
          });
        },
      },
    },
  });
}

/** RLS-aware Prisma client — default export for app code. */
export const rlsPrisma = createRlsPrismaClient();

export type RlsPrisma = typeof rlsPrisma;
