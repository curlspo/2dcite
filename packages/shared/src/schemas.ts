import { z } from "zod";
import {
  CitationFindingCode,
  ClientPlatform,
  StudentYear,
  TurnaroundTier,
  UserRole,
} from "./enums";

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.literal("2dcite-api"),
  version: z.string(),
  time: z.string(),
  env: z.string().optional(),
  storage: z.string().optional(),
  stripe: z.boolean().optional(),
  db: z.string().optional(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** True if the email domain is a .edu address (e.g. name@school.edu). */
export function isEduEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim() ?? "";
  if (!domain) return false;
  return domain === "edu" || domain.endsWith(".edu");
}

export const registerBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(10).max(128),
    name: z.string().min(1).max(200),
    role: z.enum([UserRole.ATTORNEY, UserRole.JUDGE, UserRole.STUDENT]),
    /** Required for ATTORNEY and JUDGE */
    barNumber: z.string().min(1).max(80).optional(),
  })
  .superRefine((data, ctx) => {
    const email = data.email.trim().toLowerCase();
    if (data.role === UserRole.STUDENT && !isEduEmail(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message:
          "Student accounts require a .edu email address from an accredited law school.",
      });
    }
    if (
      data.role === UserRole.ATTORNEY ||
      data.role === UserRole.JUDGE
    ) {
      const bar = data.barNumber?.trim() ?? "";
      if (bar.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["barNumber"],
          message:
            "Attorneys and judges must provide a state bar or judicial license number.",
        });
      }
    }
  });
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum([
    UserRole.ATTORNEY,
    UserRole.JUDGE,
    UserRole.STUDENT,
    UserRole.ADMIN,
  ]),
  studentStatus: z.string().nullable().optional(),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

export const studentApplicationSchema = z.object({
  lawSchool: z.string().min(2).max(300),
  year: z.enum([StudentYear.L2, StudentYear.L3]),
  legalWritingCoursePassed: z.literal(true),
  professorName: z.string().min(2).max(200),
  professorEmail: z.string().email(),
  /** Object storage keys set after presigned upload */
  enrollmentProofKey: z.string().min(1),
  legalWritingProofKey: z.string().min(1),
  professorRecKey: z.string().min(1),
});
export type StudentApplicationBody = z.infer<typeof studentApplicationSchema>;

export const createJobSchema = z.object({
  title: z.string().min(1).max(300),
  instructions: z.string().max(5000).optional(),
  turnaroundTier: z.enum([
    TurnaroundTier.STANDARD_48H,
    TurnaroundTier.RUSH,
  ]),
  pdfKey: z.string().min(1),
  /** Client must send true for each required ack id (validated server-side against copy version) */
  acknowledgments: z.object({
    copyVersion: z.string().min(1),
    acceptedIds: z.array(z.string()).min(1),
    platform: z.enum([ClientPlatform.WEB, ClientPlatform.IOS]),
  }),
});
export type CreateJobBody = z.infer<typeof createJobSchema>;

export const citationFindingSchema = z.object({
  citationText: z.string().optional(),
  code: z.enum([
    CitationFindingCode.ACCURATE,
    CitationFindingCode.NEEDS_ATTENTION,
    CitationFindingCode.DOES_NOT_SUPPORT,
    CitationFindingCode.FORMAT_ISSUE,
  ]),
  notes: z.string().max(2000).optional(),
});

export const submitReviewSchema = z.object({
  findings: z.array(citationFindingSchema).min(1),
  overallNotes: z.string().max(5000).optional(),
  attestationAccepted: z.literal(true),
  disclaimerCopyVersion: z.string().min(1),
  platform: z.enum([ClientPlatform.WEB, ClientPlatform.IOS]),
});
export type SubmitReviewBody = z.infer<typeof submitReviewSchema>;
