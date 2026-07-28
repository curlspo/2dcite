/**
 * Canonical legal / product disclaimer copy.
 * Web, iOS, certificates, and Terms must import from here (or content/legal)
 * so language cannot drift across surfaces.
 *
 * Bump DISCLAIMER_COPY_VERSION when any user-facing acknowledgment text changes.
 * Stored LiabilityAcknowledgment rows reference this version.
 */

export const DISCLAIMER_COPY_VERSION = "2026-07-26.3";

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

/** Confidentiality and limited submission scope */
export const CONFIDENTIALITY_CORE = {
  noResponsibilityForConfidential:
    "2dcite takes no responsibility for confidential, privileged, sealed, or otherwise sensitive documents or information you choose to upload. You are solely responsible for determining what material is appropriate to submit and for complying with court orders, professional obligations, and applicable law.",
  limitedSubmissionToa:
    "Submissions may be limited to a table of authorities (or a comparable list of citations) solely to confirm the existence and citation form of authorities. You are not required to upload an entire brief or order if a limited submission is sufficient for the review you request.",
  studentConfidentiality:
    "Student reviewers are bound by confidentiality. Except as required by law, a student may not disclose any non-public information obtained through a review—including the identity of the submitting attorney or judge, the content of submitted materials, review findings, or the fact that a particular review occurred—to any third party.",
  noDisclosureOfFailedCitations:
    "Without prior written authorization from the submitting attorney or judge (the disclosing party), a student may not disclose that a citation did not pass review, failed verification, appeared fabricated or hallucinated, or otherwise did not support a proposition—including any disclosure that a particular lawyer or judge used non-existent or hallucinated authorities.",
  findingsOnlyToClient:
    "Review findings and any certificate are provided only to the submitting party through the platform (and platform administrators as needed to operate the service). Students must not share findings outside the platform.",
  clientSoleRiskOfUpload:
    "By uploading materials, you acknowledge that transmission and storage involve residual risk, and that 2dcite’s security measures do not create liability for unauthorized access, disclosure, or loss of confidential information beyond what applicable law non-waivably requires.",
  /**
   * Blind matching: student identities are never shown to attorneys/judges
   * so reviewers can flag citation errors candidly without retaliation risk.
   */
  blindMatching:
    "2dcite uses a blind matching system. Student reviewers are assigned without disclosing the student’s name, contact information, school, or other identifying details to the submitting attorney or judge. Client-facing job records and Certificates of Citation Review identify the reviewer only as an independent, qualified law-student reviewer. This protects students from retaliation after flagging citation errors and is designed so students can be completely candid without fear of retribution.",
  blindMatchingRetention:
    "2dcite retains student identity and review records internally so that, if a court, bar association, or other lawful authority requires production, 2dcite can produce the retained record. Retention for that purpose does not authorize disclosure of student identity to the submitting attorney or judge in the ordinary course of the service.",
} as const;

/** Intellectual property notice (product code and build) */
export const IP_NOTICE = {
  copyright:
    "The 2dcite software, source code, documentation, branding, and build artifacts are owned by 2dcite LLC and are protected by United States copyright law and other applicable intellectual property laws. © 2026 2dcite LLC. All rights reserved.",
  noLicense:
    "No license—express, implied, or statutory—is granted to copy, modify, distribute, reverse engineer, create derivative works of, or commercially exploit the 2dcite code, build, or related materials, except as expressly authorized in a separate written agreement signed by 2dcite LLC. Access to the hosted service under these Terms is a limited, revocable right to use the Platform as an end user, not a software license or transfer of ownership.",
} as const;

/**
 * Timing of review relative to filing / issuance.
 * Positions 2dcite as usable after filing or after an order is issued,
 * including for correction or withdrawal of particularly sensitive matters.
 */
export const POST_FILING_CORE = {
  postFilingAndPostIssuanceOk:
    "Documents may be uploaded for citation review after a brief or other paper has been filed, and after a court order has been issued. Pre-filing and pre-issuance review is also available; you choose the timing that fits your professional judgment and local rules.",
  opportunityToCorrectOrWithdraw:
    "Post-filing and post-issuance review can provide an opportunity to identify citation problems and, where appropriate under applicable rules and professional obligations, to seek to correct a filing, file a notice of errata or supplemental authority, move for relief, or withdraw or amend an order—actions solely determined and executed by the licensed attorney or judge, not by 2dcite or student reviewers.",
  sensitiveMatters:
    "Using the platform after filing or issuance can reduce exposure for particularly sensitive filings and orders by allowing independent verification of authorities while limiting what must be shared before a public filing or entry of an order (for example, by submitting a table of authorities only, or by reviewing after the fact under confidentiality protections).",
  noDutyToCorrect:
    "2dcite does not file, correct, withdraw, or amend any paper or order on your behalf, does not advise whether correction or withdrawal is required or available, and does not guarantee that any court will permit correction or withdrawal. Those decisions and actions remain solely yours.",
} as const;

/** Short footer used across app shells */
export const LIABILITY_FOOTER =
  "Citation review on 2dcite is an independent verification layer only. Ultimate liability remains with the licensed attorney or judge. Checking citations is a non-delegable duty. Documents may be reviewed after filing or after an order is issued, which may allow opportunity to correct a filing or withdraw an order. 2dcite takes no responsibility for confidential materials you upload. Students are bound by confidentiality and may not disclose failed or hallucinated citations without written authorization from the submitting party.";

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
  {
    id: "confidential_documents",
    text: CONFIDENTIALITY_CORE.noResponsibilityForConfidential,
  },
  {
    id: "limited_toa_ok",
    text: CONFIDENTIALITY_CORE.limitedSubmissionToa,
  },
  {
    id: "student_confidentiality_understood",
    text: `${CONFIDENTIALITY_CORE.studentConfidentiality} ${CONFIDENTIALITY_CORE.noDisclosureOfFailedCitations}`,
  },
  {
    id: "post_filing_post_issuance",
    text: `${POST_FILING_CORE.postFilingAndPostIssuanceOk} ${POST_FILING_CORE.opportunityToCorrectOrWithdraw} ${POST_FILING_CORE.noDutyToCorrect}`,
  },
] as const;

/**
 * Required attestation before student submits a review.
 * Includes confidentiality and non-disclosure of failed/hallucinated citations.
 */
export const STUDENT_REVIEW_ATTESTATION =
  "I completed an independent citation review of the assigned materials. I am not providing legal advice or co-counsel services. Ultimate liability for the document remains with the licensed attorney or judge. I understand that checking citations is a non-delegable professional duty and that my work is an independent verification layer only. " +
  "I am bound by confidentiality: except as required by law, I will not disclose any non-public information from this review—including the identity of the submitting attorney or judge, the content of submitted materials, my findings, or the fact of this review—to any third party. " +
  "Without prior written authorization from the submitting attorney or judge, I will not disclose that any citation failed verification, did not pass review, appeared fabricated or hallucinated, or that a particular lawyer or judge used non-existent or hallucinated authorities. " +
  "I will communicate findings only through the 2dcite platform to the submitting party (and will not share findings outside the platform).";

/** Certificate boilerplate (injected into generated PDF) */
export const CERTIFICATE_BOILERPLATE = {
  title: "Certificate of Citation Review",
  limitedScope: LIABILITY_CORE.certificateScope,
  liability: LIABILITY_CORE.ultimateLiability,
  nonDelegable: LIABILITY_CORE.nonDelegableDuty,
  noResponsibility: LIABILITY_CORE.noPlatformResponsibility,
  notLegalAdvice: LIABILITY_CORE.notLegalAdvice,
  confidentiality:
    "Submitted materials may be confidential. 2dcite takes no responsibility for confidential documents uploaded by the submitting party. Student reviewers are bound by confidentiality and, without written authorization from the submitting party, may not disclose failed verifications or alleged use of fabricated or hallucinated authorities.",
  limitedSubmissionNote:
    "Reviews may be based on a full document or a limited submission such as a table of authorities, as provided by the submitting party, for verification of the existence and form of cited authorities.",
  postFilingNote:
    "Materials may be submitted before or after filing, and before or after issuance of an order. Post-filing or post-issuance review may inform the submitting party’s independent decision whether to seek correction of a filing or withdrawal or amendment of an order under applicable rules. 2dcite does not itself correct, withdraw, or amend any filing or order.",
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
  /** Plain-language charge/refund trigger for UI */
  chargedOnSubmitRefundIfUnfulfilled:
    "You’re charged when you submit — fully refunded if your document isn’t reviewed.",
} as const;

/**
 * Full disclaimer body as structured sections (homepage /disclaimer page +
 * in-flow acknowledgment panel). Content must stay in sync with legal pages.
 */
export const FULL_DISCLAIMER_SECTIONS = [
  {
    heading: null as string | null,
    paragraphs: [
      LIABILITY_CORE.ultimateLiability,
      LIABILITY_CORE.nonDelegableDuty,
      LIABILITY_CORE.noPlatformResponsibility,
      LIABILITY_CORE.certificateScope,
      LIABILITY_CORE.noAttorneyClient,
      LIABILITY_CORE.notLegalAdvice,
      CERTIFICATE_BOILERPLATE.mayFileOrRetain,
    ],
  },
  {
    heading: "Confidential documents",
    paragraphs: [
      CONFIDENTIALITY_CORE.noResponsibilityForConfidential,
      CONFIDENTIALITY_CORE.clientSoleRiskOfUpload,
    ],
  },
  {
    heading: "Limited submissions (table of authorities)",
    paragraphs: [CONFIDENTIALITY_CORE.limitedSubmissionToa],
  },
  {
    heading: "Post-filing and post-issuance review",
    paragraphs: [
      POST_FILING_CORE.postFilingAndPostIssuanceOk,
      POST_FILING_CORE.opportunityToCorrectOrWithdraw,
      POST_FILING_CORE.sensitiveMatters,
      POST_FILING_CORE.noDutyToCorrect,
    ],
  },
  {
    heading: "Student confidentiality and non-disclosure",
    paragraphs: [
      CONFIDENTIALITY_CORE.studentConfidentiality,
      CONFIDENTIALITY_CORE.noDisclosureOfFailedCitations,
      CONFIDENTIALITY_CORE.findingsOnlyToClient,
    ],
  },
  {
    heading: "Blind matching (student identity protection)",
    paragraphs: [
      CONFIDENTIALITY_CORE.blindMatching,
      CONFIDENTIALITY_CORE.blindMatchingRetention,
    ],
  },
  {
    heading: "Payments held by the platform",
    paragraphs: [
      FUNDS_HOLD_COPY.clientPayOnUpload,
      FUNDS_HOLD_COPY.releaseOnCertificate,
      FUNDS_HOLD_COPY.chargedOnSubmitRefundIfUnfulfilled,
    ],
  },
] as const;

/** Support contact (override via env in production UI if needed) */
export const SUPPORT_EMAIL = "support@2dcite.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
