import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma, type User, type StudentProfile, type UserRole } from "@2dcite/db";

export const SESSION_COOKIE = "2dcite_session";
const SESSION_DAYS = 30;

export type SessionUser = User & {
  studentProfile: StudentProfile | null;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token: hashToken(token) },
  });
}

export async function getUserByToken(
  token: string | null | undefined
): Promise<SessionUser | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: {
      user: { include: { studentProfile: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
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
  const token = await getTokenFromRequest(request);
  const user = await getUserByToken(token);
  if (!user) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return user;
}

export async function requireRole(
  request: Request,
  roles: UserRole[]
): Promise<SessionUser> {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return user;
}

/** Server Components / Server Actions: read session cookie */
export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return getUserByToken(token ?? null);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export function toMeResponse(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
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
