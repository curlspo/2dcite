import { prisma } from "@2dcite/db";
import {
  LAW_SCHOOL_NOT_LISTED,
  STUDENT_CREDENTIAL_REVIEW_HOURS,
  isAllowedLawSchool,
  studentApplicationSchema,
} from "@2dcite/shared";
import { requireRole, toMeResponse } from "@/lib/session";
import { uploadExists } from "@/lib/storage";
import { writeAudit } from "@/lib/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp } from "@/lib/rate-limit";
import { captchaTokenFromBody, verifyCaptchaToken } from "@/lib/captcha";

/** Persist school for admin review: listed name, or "Not listed — {other}" */
function resolveLawSchoolStored(
  lawSchool: string,
  lawSchoolOther?: string
): string {
  if (lawSchool === LAW_SCHOOL_NOT_LISTED && lawSchoolOther?.trim()) {
    return `${LAW_SCHOOL_NOT_LISTED} — ${lawSchoolOther.trim()}`;
  }
  return lawSchool.trim();
}

/** GET current student application / profile status */
export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ["STUDENT"]);
    return jsonOk({
      user: toMeResponse(user),
      applicationComplete: Boolean(
        user.studentProfile?.lawSchool &&
          user.studentProfile.enrollmentProofKey &&
          user.studentProfile.legalWritingProofKey &&
          user.studentProfile.professorRecKey
      ),
      eligibleForMatching: user.studentProfile?.status === "APPROVED",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST / submit or update student eligibility application */
export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ["STUDENT"]);
    const raw = await request.json();
    const captcha = await verifyCaptchaToken(
      captchaTokenFromBody(raw),
      clientIp(request)
    );
    if (!captcha.ok) {
      return jsonError(
        "Please complete the security check and try again.",
        400,
        "CAPTCHA_FAILED"
      );
    }
    const body = studentApplicationSchema.parse(raw);

    if (!isAllowedLawSchool(body.lawSchool)) {
      return jsonError(
        "Select your law school from the list, or choose Not listed.",
        400,
        "LAW_SCHOOL_REQUIRED"
      );
    }

    if (user.studentProfile?.status === "APPROVED") {
      return jsonError(
        "Approved applications cannot be edited. Contact support for changes.",
        400,
        "ALREADY_APPROVED"
      );
    }

    for (const key of [
      body.enrollmentProofKey,
      body.legalWritingProofKey,
      body.professorRecKey,
    ]) {
      if (!(await uploadExists(key))) {
        return jsonError(
          `Upload not found: ${key}`,
          400,
          "UPLOAD_MISSING"
        );
      }
      if (!key.includes(user.id)) {
        return jsonError("Invalid upload key for this user", 400, "UPLOAD_OWNER");
      }
    }

    const lawSchoolStored = resolveLawSchoolStored(
      body.lawSchool,
      body.lawSchoolOther
    );

    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        lawSchool: lawSchoolStored,
        year: body.year,
        legalWritingCoursePassed: true,
        professorName: body.professorName.trim(),
        professorEmail: body.professorEmail.toLowerCase().trim(),
        enrollmentProofKey: body.enrollmentProofKey,
        legalWritingProofKey: body.legalWritingProofKey,
        professorRecKey: body.professorRecKey,
        status: "PENDING",
        rejectionReason: null,
      },
      update: {
        lawSchool: lawSchoolStored,
        year: body.year,
        legalWritingCoursePassed: true,
        professorName: body.professorName.trim(),
        professorEmail: body.professorEmail.toLowerCase().trim(),
        enrollmentProofKey: body.enrollmentProofKey,
        legalWritingProofKey: body.legalWritingProofKey,
        professorRecKey: body.professorRecKey,
        status: "PENDING",
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "student.application.submit",
      entityType: "StudentProfile",
      entityId: profile.id,
      metadata: {
        year: body.year,
        lawSchool: lawSchoolStored,
        listedSchool: body.lawSchool !== LAW_SCHOOL_NOT_LISTED,
      },
    });

    const refreshed = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { studentProfile: true },
    });

    return jsonOk({
      user: toMeResponse(refreshed),
      message: `Application submitted. 2dcite LLC reviews credentials manually — typically within ${STUDENT_CREDENTIAL_REVIEW_HOURS} hours. You cannot receive assignments until approved.`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
