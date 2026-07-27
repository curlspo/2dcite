import { prisma as rawPrisma } from "./client";
import { createRlsPrismaClient } from "./rls";

/**
 * Default DB client: every query runs under RLS transaction context
 * (user / bypass / deny from AsyncLocalStorage — see rls.ts).
 */
export const prisma = createRlsPrismaClient(rawPrisma);

/** Unwrapped client for rare cases (migrations helpers). Prefer prisma. */
export { rawPrisma };
export { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
export {
  findNextAvailableStudent,
  findNextQueuedJob,
  assignmentDeadline,
  reviewDueAt,
  ASSIGNMENT_ACCEPT_MINUTES,
} from "./matching";
export {
  applyRlsConfig,
  createRlsPrismaClient,
  enterBypassRls,
  enterRlsContext,
  enterUserRls,
  getRlsContext,
  rlsPrisma,
  runWithBypassRls,
  runWithRls,
  runWithUserRls,
  type RlsContext,
  type RlsPrisma,
  type Tx,
} from "./rls";
