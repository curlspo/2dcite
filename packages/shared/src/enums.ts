/** Shared domain enums — single source of truth for web, mobile, and API. */

export const UserRole = {
  ATTORNEY: "ATTORNEY",
  JUDGE: "JUDGE",
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const StudentYear = {
  L2: "L2",
  L3: "L3",
} as const;
export type StudentYear = (typeof StudentYear)[keyof typeof StudentYear];

export const StudentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const JobStatus = {
  DRAFT: "DRAFT",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  QUEUED: "QUEUED",
  ASSIGNED: "ASSIGNED",
  IN_REVIEW: "IN_REVIEW",
  COMPLETED: "COMPLETED",
  CERTIFIED: "CERTIFIED",
  CANCELLED: "CANCELLED",
  REASSIGNING: "REASSIGNING",
  FLAGGED: "FLAGGED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const TurnaroundTier = {
  STANDARD_48H: "STANDARD_48H",
  RUSH: "RUSH",
} as const;
export type TurnaroundTier =
  (typeof TurnaroundTier)[keyof typeof TurnaroundTier];

export const PayoutStatus = {
  HELD: "HELD",
  RELEASED: "RELEASED",
  REFUNDED: "REFUNDED",
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ClientPlatform = {
  WEB: "WEB",
  IOS: "IOS",
} as const;
export type ClientPlatform =
  (typeof ClientPlatform)[keyof typeof ClientPlatform];

export const CitationFindingCode = {
  ACCURATE: "ACCURATE",
  NEEDS_ATTENTION: "NEEDS_ATTENTION",
  DOES_NOT_SUPPORT: "DOES_NOT_SUPPORT",
  FORMAT_ISSUE: "FORMAT_ISSUE",
} as const;
export type CitationFindingCode =
  (typeof CitationFindingCode)[keyof typeof CitationFindingCode];
