# 2dcite — Product Rules

Canonical product rules for engineering. UI, certificates, and Terms must not contradict this document.

## Mission

2dcite matches **attorneys and judges** with **qualified law students** for independent **human-in-the-loop citation review** of briefs and court orders. Students are paid per completed job; the platform takes a cut. A **Certificate of Citation Review** provides evidence of risk mitigation and best efforts.

## Liability (non-negotiable)

1. **Ultimate liability** always remains with the licensed attorney or judge.
2. Checking citations is a **non-delegable duty**. The student provides an **independent verification layer only**.
3. The platform and students **do not** take legal responsibility for the filed document.
4. The Certificate is **not** a warranty of correctness or outcome and is **not** legal advice.
5. Use of the platform does **not** create an attorney-client relationship between student and client regarding the document.

## Confidentiality & limited submissions (non-negotiable)

1. **2dcite takes no responsibility** for confidential, privileged, sealed, or sensitive materials uploaded by the client.
2. Clients may submit a **table of authorities only** (or similar citation list) to confirm existence/form of cases—full brief/order is optional.
3. **Students are bound by confidentiality** and may not disclose non-public review information except as required by law.
4. **Students may not disclose failed / hallucinated citations** (including that a particular lawyer or judge used non-existent authorities) **without prior written authorization** from the submitting party.
5. Findings are delivered **only to the submitting party through the platform**.

Implementation: `packages/shared/src/disclaimers.ts` (`DISCLAIMER_COPY_VERSION`). Bump version when acknowledgment text changes.

## Student eligibility (strict)

- Currently enrolled at an accredited law school
- 2L or 3L only
- Taken and passed a legal writing course
- Recommended by a professor
- **Manual admin review** of uploaded proof before approval
- **One active assignment at a time**

## Funds flow (escrow-style)

1. Client **pays on document upload/submit** (Stripe).
2. Platform **holds** the full fee (`Payout.status = HELD`).
3. Work proceeds: queue → assign → review.
4. On successful review, system **auto-generates Certificate**.
5. **Only then** release student share; platform retains cut (`RELEASED`).
6. Student must not receive funds before a Certificate exists.
7. Release must be **idempotent** (cert creation must not double-pay).

## Turnaround

- **Standard:** 48 hours after student accepts.
- **Rush:** shorter SLA for an additional fee; rush jobs prioritized in matching queue.

## Platforms

- **Web:** 2dcite.com — full product + admin
- **iOS:** App Store — client + student flows (no admin)
- **API-first:** `/api/v1/*` shared by both clients

## Matching

Auto-assign next available approved student (no active job). Student accepts or job requeues. Rush before standard.

## Out of MVP

Firm seats, open job board, chat, AI auto-check, Android store, multi-currency, automatic bar verification, complex dispute UI.
