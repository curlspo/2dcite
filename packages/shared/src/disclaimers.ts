/**
 * Canonical legal / product disclaimer copy.
 * Web, iOS, certificates, and Terms must import from here (or content/legal)
 * so language cannot drift across surfaces.
 *
 * Bump DISCLAIMER_COPY_VERSION when any user-facing acknowledgment text changes.
 * Stored LiabilityAcknowledgment rows reference this version.
 */

export const DISCLAIMER_COPY_VERSION = "2026-07-26.1";

export const LIABILITY_CORE = {
  ultimateLiability:
    "Ultimate liability for any brief, order, filing, or legal work product always remains with the licensed attorney or judge.",
  nonDelegableDuty:
    "Checking citations is a non-delegable professional duty. The law student provides an independent verification layer only.",
  noPlatformResponsibility:
    "Neither 2dcite nor participating law students take legal responsibility for the filed document or for legal outcomes.",
  certificateScope:
    "The Certificate of Citation Review evidences best efforts and risk mitigation through independent verification. It is not a warranty of correctness, completeness, or outcome, and does not constitute legal advice.",
  noAttorneyClient:
    "Use of 2dcite does not create an attorney-client relationship between the student reviewer and the submitting attorney or judge, nor between the platform and any party regarding the substance of the document.",
  notLegalAdvice:
    "2dcite and student reviewers do not provide legal advice, co-counsel services, or authorization to file any document.",
} as const;

/** Short footer used across app shells */
export const LIABILITY_FOOTER =
  "Citation review on 2dcite is an independent verification layer only. Ultimate liability remains with the licensed attorney or judge. Checking citations is a non-delegable duty.";

/** Required checkboxes before client pays / submits a job */
export const CLIENT_SUBMIT_ACKNOWLEDGMENTS = [
  {
    id: "ultimate_liability",
    text: LIABILITY_CORE.ultimateLiability,
  },
  {
    id: "non_delegable",
    text: LIABILITY_CORE.nonDelegableDuty,
  },
  {
    id: "no_platform_responsibility",
    text: LIABILITY_CORE.noPlatformResponsibility,
  },
  {
    id: "not_legal_advice",
    text: LIABILITY_CORE.notLegalAdvice,
  },
] as const;

/** Required attestation before student submits a review */
export const STUDENT_REVIEW_ATTESTATION =
  "I completed an independent citation review of the assigned document. I am not providing legal advice or co-counsel services. Ultimate liability for the document remains with the licensed attorney or judge. I understand that checking citations is a non-delegable professional duty and that my work is an independent verification layer only.";

/** Certificate boilerplate (injected into generated PDF) */
export const CERTIFICATE_BOILERPLATE = {
  title: "Certificate of Citation Review",
  limitedScope: LIABILITY_CORE.certificateScope,
  liability: LIABILITY_CORE.ultimateLiability,
  nonDelegable: LIABILITY_CORE.nonDelegableDuty,
  noResponsibility: LIABILITY_CORE.noPlatformResponsibility,
  notLegalAdvice: LIABILITY_CORE.notLegalAdvice,
  mayFileOrRetain:
    "This certificate may be filed with the underlying document or retained by the attorney or judge as evidence of risk mitigation and best efforts through independent verification.",
} as const;

/** Funds hold / release product language (UI + Terms reference) */
export const FUNDS_HOLD_COPY = {
  clientPayOnUpload:
    "Payment is collected when you submit your document. 2dcite holds the funds until a Certificate of Citation Review is issued.",
  releaseOnCertificate:
    "The student reviewer’s share is released only after the system automatically generates the Certificate of Citation Review. The platform retains its service fee.",
  heldStatus:
    "Funds held by 2dcite pending certificate issuance.",
} as const;

/** Support contact (override via env in production UI if needed) */
export const SUPPORT_EMAIL = "support@2dcite.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
