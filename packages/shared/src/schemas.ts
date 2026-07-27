import { z } from "zod";
import {
  CitationFindingCode,
  ClientPlatform,
  StudentYear,
  TurnaroundTier,
  UserRole,
} from "./enums";
import {
  sanitizeEmail,
  sanitizeSingleLine,
  sanitizeUserText,
} from "./sanitize";
import { isUsStateCode, normalizeUsStateCode } from "./us-states";

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

const nameField = z
  .string()
  .min(1)
  .max(200)
  .transform((v) => sanitizeUserText(v));

const emailField = z
  .string()
  .email()
  .max(320)
  .transform((v) => sanitizeEmail(v));

export const registerBodySchema = z
  .object({
    email: emailField,
    password: z.string().min(10).max(128),
    name: nameField,
    role: z.enum([UserRole.ATTORNEY, UserRole.JUDGE, UserRole.STUDENT]),
    /** Required for ATTORNEY and JUDGE — jurisdiction of the bar / license */
    barState: z
      .string()
      .min(2)
      .max(2)
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        return normalizeUsStateCode(v) ?? sanitizeSingleLine(v).toUpperCase();
      }),
    /** Required for ATTORNEY and JUDGE — number is only meaningful with barState */
    barNumber: z
      .string()
      .min(1)
      .max(80)
      .optional()
      .transform((v) => (v === undefined ? undefined : sanitizeSingleLine(v))),
  })
  .superRefine((data, ctx) => {
    const email = data.email;
    if (data.role === UserRole.STUDENT && !isEduEmail(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message:
          "Student accounts require a .edu email address from an accredited law school.",
      });
    }
    if (data.role === UserRole.ATTORNEY || data.role === UserRole.JUDGE) {
      const state = data.barState?.trim() ?? "";
      if (!state || !isUsStateCode(state)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["barState"],
          message:
            "Select the state (or territory) where your bar or judicial license is issued.",
        });
      }
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
  email: emailField,
  password: z.string().min(1).max(128),
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
  lawSchool: z
    .string()
    .min(2)
    .max(300)
    .transform((v) => sanitizeUserText(v)),
  year: z.enum([StudentYear.L2, StudentYear.L3]),
  legalWritingCoursePassed: z.literal(true),
  professorName: z
    .string()
    .min(2)
    .max(200)
    .transform((v) => sanitizeUserText(v)),
  professorEmail: emailField,
  /** Object storage keys set after presigned upload */
  enrollmentProofKey: z
    .string()
    .min(1)
    .max(500)
    .transform((v) => sanitizeSingleLine(v)),
  legalWritingProofKey: z
    .string()
    .min(1)
    .max(500)
    .transform((v) => sanitizeSingleLine(v)),
  professorRecKey: z
    .string()
    .min(1)
    .max(500)
    .transform((v) => sanitizeSingleLine(v)),
});
export type StudentApplicationBody = z.infer<typeof studentApplicationSchema>;

export const createJobSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(300)
    .transform((v) => sanitizeUserText(v)),
  instructions: z
    .string()
    .max(5000)
    .optional()
    .transform((v) =>
      v === undefined ? undefined : sanitizeUserText(v, { multiline: true })
    ),
  turnaroundTier: z.enum([
    TurnaroundTier.STANDARD_48H,
    TurnaroundTier.RUSH,
  ]),
  pdfKey: z
    .string()
    .min(1)
    .max(500)
    .transform((v) => sanitizeSingleLine(v)),
  acknowledgments: z.object({
    copyVersion: z.string().min(1).max(40),
    acceptedIds: z.array(z.string().max(80)).min(1).max(50),
    platform: z.enum([ClientPlatform.WEB, ClientPlatform.IOS]),
  }),
});
export type CreateJobBody = z.infer<typeof createJobSchema>;

export const citationFindingSchema = z.object({
  citationText: z
    .string()
    .max(2000)
    .optional()
    .transform((v) =>
      v === undefined ? undefined : sanitizeUserText(v, { multiline: true })
    ),
  code: z.enum([
    CitationFindingCode.ACCURATE,
    CitationFindingCode.NEEDS_ATTENTION,
    CitationFindingCode.DOES_NOT_SUPPORT,
    CitationFindingCode.FORMAT_ISSUE,
  ]),
  notes: z
    .string()
    .max(2000)
    .optional()
    .transform((v) =>
      v === undefined ? undefined : sanitizeUserText(v, { multiline: true })
    ),
});

export const submitReviewSchema = z.object({
  findings: z.array(citationFindingSchema).min(1).max(500),
  overallNotes: z
    .string()
    .max(5000)
    .optional()
    .transform((v) =>
      v === undefined ? undefined : sanitizeUserText(v, { multiline: true })
    ),
  attestationAccepted: z.literal(true),
  disclaimerCopyVersion: z.string().min(1).max(40),
  platform: z.enum([ClientPlatform.WEB, ClientPlatform.IOS]),
});
export type SubmitReviewBody = z.infer<typeof submitReviewSchema>;
