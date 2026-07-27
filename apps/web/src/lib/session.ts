import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  rawPrisma,
  enterUserRls,
  type User,
  type StudentProfile,
  type UserRole,
  type Session,
} from "@2dcite/db";

export const SESSION_COOKIE = "2dcite_session";
const SESSION_DAYS = 30;
/** How long step-up elevation lasts after TOTP re-auth */
export const STEP_UP_MINUTES = 15;

export type SessionUser = User & {
  studentProfile: StudentProfile | null;
};

export type SessionContext = {
  user: SessionUser;
  session: Session;
  token: string;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(
  userId: string,
  opts?: { mfaVerified?: boolean }
): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  // rawPrisma for session writes — public auth must not depend on RLS SET ROLE
  await rawPrisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      expiresAt,
      mfaVerifiedAt: opts?.mfaVerified ? new Date() : null,
    },
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await rawPrisma.session.deleteMany({
    where: { token: hashToken(token) },
  });
}

export async function getSessionByToken(
  token: string | null | undefined
): Promise<SessionContext | null> {
  if (!token) return null;

  // Session lookup is pre-auth; use unwrapped client (owner BYPASSRLS)
  const session = await rawPrisma.session.findUnique({
    where: { token: hashToken(token) },
    include: {
      user: { include: { studentProfile: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await rawPrisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    user: session.user,
    session,
    token,
  };
}

export async function getUserByToken(
  token: string | null | undefined
): Promise<SessionUser | null> {
  const ctx = await getSessionByToken(token);
  return ctx?.user ?? null;
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function getTokenFromRequest(
  request: Request
): Promise<string | null> {
  const bearer = extractBearerToken(request);
  if (bearer) return bearer;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const ctx = await requireSession(request);
  return ctx.user;
}

export async function requireSession(request: Request): Promise<SessionContext> {
  const token = await getTokenFromRequest(request);
  const ctx = await getSessionByToken(token);
  if (!ctx) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return ctx;
}

/**
 * Require role. For ADMIN:
 * - If MFA is enabled, session must have mfaVerifiedAt
 * - If MFA is not enabled, allow access only to MFA setup paths (caller enforces)
 */
export async function requireRole(
  request: Request,
  roles: UserRole[]
): Promise<SessionUser> {
  const ctx = await requireSession(request);
  if (!roles.includes(ctx.user.role)) {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }

  if (ctx.user.role === "ADMIN" && roles.includes("ADMIN")) {
    await assertAdminMfaSatisfied(ctx);
  }

  return ctx.user;
}

/** Admin must complete MFA when enabled. */
export async function assertAdminMfaSatisfied(
  ctx: SessionContext
): Promise<void> {
  if (ctx.user.role !== "ADMIN") return;
  if (!ctx.user.mfaEnabled) return;
  if (ctx.session.mfaVerifiedAt) return;
  const err = new Error("MFA required") as Error & {
    status: number;
    code?: string;
  };
  err.status = 403;
  err.code = "MFA_REQUIRED";
  throw err;
}

/**
 * Sensitive admin ops require recent step-up TOTP (or MFA just verified).
 */
export async function requireAdminStepUp(
  request: Request
): Promise<SessionContext> {
  const ctx = await requireSession(request);
  if (ctx.user.role !== "ADMIN") {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }
  await assertAdminMfaSatisfied(ctx);

  // If MFA not yet enabled, force setup before step-up ops
  if (!ctx.user.mfaEnabled) {
    const err = new Error("MFA setup required") as Error & {
      status: number;
      code?: string;
    };
    err.status = 403;
    err.code = "MFA_SETUP_REQUIRED";
    throw err;
  }

  const now = new Date();
  const elevated =
    (ctx.session.stepUpUntil && ctx.session.stepUpUntil > now) ||
    (ctx.session.mfaVerifiedAt &&
      now.getTime() - ctx.session.mfaVerifiedAt.getTime() < 2 * 60 * 1000);

  if (!elevated) {
    const err = new Error("Step-up authentication required") as Error & {
      status: number;
      code?: string;
    };
    err.status = 403;
    err.code = "STEP_UP_REQUIRED";
    throw err;
  }

  return ctx;
}

export async function markSessionMfaVerified(sessionId: string): Promise<void> {
  const stepUp = new Date();
  stepUp.setMinutes(stepUp.getMinutes() + STEP_UP_MINUTES);
  await rawPrisma.session.update({
    where: { id: sessionId },
    data: {
      mfaVerifiedAt: new Date(),
      stepUpUntil: stepUp,
    },
  });
}

export async function markSessionStepUp(sessionId: string): Promise<void> {
  const stepUp = new Date();
  stepUp.setMinutes(stepUp.getMinutes() + STEP_UP_MINUTES);
  await rawPrisma.session.update({
    where: { id: sessionId },
    data: { stepUpUntil: stepUp },
  });
}

/**
 * Run authenticated request work under this user's RLS policies.
 * Prefer for route handlers and server pages after identity is known.
 */
export async function asUser<T>(
  user: { id: string; role: string },
  fn: () => Promise<T>
): Promise<T> {
  return enterUserRls(user, fn);
}

/** Server Components: read session cookie */
export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return getUserByToken(token ?? null);
}

export async function getSessionContextFromCookies(): Promise<SessionContext | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return getSessionByToken(token ?? null);
}

/** OWASP session cookie flags */
export function sessionCookieOptions(expiresAt?: Date) {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : { maxAge: 0 }),
  };
}

export function clearSessionCookieOptions() {
  return {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}

export function toMeResponse(
  user: SessionUser,
  session?: Session | null
) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    mfaVerified: Boolean(session?.mfaVerifiedAt) || user.role !== "ADMIN",
    mfaSetupRequired: user.role === "ADMIN" && !user.mfaEnabled,
    stepUpActive: Boolean(
      session?.stepUpUntil && session.stepUpUntil > new Date()
    ),
    studentStatus: user.studentProfile?.status ?? null,
    studentProfile: user.studentProfile
      ? {
          id: user.studentProfile.id,
          lawSchool: user.studentProfile.lawSchool,
          year: user.studentProfile.year,
          status: user.studentProfile.status,
          professorName: user.studentProfile.professorName,
          professorEmail: user.studentProfile.professorEmail,
          legalWritingCoursePassed:
            user.studentProfile.legalWritingCoursePassed,
          hasEnrollmentProof: Boolean(user.studentProfile.enrollmentProofKey),
          hasLegalWritingProof: Boolean(
            user.studentProfile.legalWritingProofKey
          ),
          hasProfessorRec: Boolean(user.studentProfile.professorRecKey),
          rejectionReason: user.studentProfile.rejectionReason,
        }
      : null,
  };
}
