import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { randomBytes } from "crypto";
import {
  CERTIFICATE_BOILERPLATE,
  DISCLAIMER_COPY_VERSION,
  FUNDS_HOLD_COPY,
} from "@2dcite/shared";
import { prisma } from "@2dcite/db";
import { saveUpload } from "@/lib/storage";
import { writeAudit } from "@/lib/audit";

export function generateCertNumber(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `2DCITE-${year}-${suffix}`;
}

export type CertJobInput = {
  id: string;
  title: string;
  turnaroundTier: string;
  completedAt: Date | null;
  client: { name: string; role: string; email: string };
  student: {
    name: string;
    studentProfile?: { lawSchool: string | null } | null;
  } | null;
  review: {
    findings: unknown;
    overallNotes: string | null;
    submittedAt: Date;
  } | null;
};

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Build professional Certificate PDF buffer (pdf-lib — Next.js friendly) */
export async function renderCertificatePdf(
  job: CertJobInput,
  certNumber: string,
  issuedAt: Date
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([612, 792]); // LETTER
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const maxWidth = 500;
  let y = 742;

  const ink = rgb(0.06, 0.09, 0.2);
  const muted = rgb(0.36, 0.4, 0.46);
  const gold = rgb(0.72, 0.53, 0.04);

  const ensureSpace = (need: number) => {
    if (y - need < 56) {
      page = pdf.addPage([612, 792]);
      y = 742;
    }
  };

  const draw = (
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      gap?: number;
      maxChars?: number;
    } = {}
  ) => {
    const size = opts.size ?? 10;
    const color = opts.color ?? ink;
    const f = opts.bold ? fontBold : font;
    const lines = wrapText(text, opts.maxChars ?? 88);
    for (const line of lines) {
      ensureSpace(size + 4);
      page.drawText(line, {
        x: margin,
        y,
        size,
        font: f,
        color,
        maxWidth,
      });
      y -= size + 3;
    }
    y -= opts.gap ?? 4;
  };

  draw("2DCITE", { size: 11, bold: true, color: gold, gap: 6 });
  draw(CERTIFICATE_BOILERPLATE.title, { size: 18, bold: true, gap: 6 });
  draw("Independent human-in-the-loop citation verification", {
    size: 9,
    color: muted,
    gap: 14,
  });

  page.drawLine({
    start: { x: margin, y },
    end: { x: 612 - margin, y },
    thickness: 1,
    color: rgb(0.89, 0.88, 0.85),
  });
  y -= 16;

  draw(`Certificate number: ${certNumber}`, { size: 10, bold: true });
  draw(`Issued: ${issuedAt.toISOString()}`, { size: 9, color: muted, gap: 2 });
  draw(`Job ID: ${job.id}`, { size: 9, color: muted, gap: 2 });
  draw(`Document: ${job.title}`, { size: 9, color: muted, gap: 2 });
  draw(
    `Turnaround: ${job.turnaroundTier === "RUSH" ? "Rush" : "Standard (48h)"}`,
    { size: 9, color: muted, gap: 10 }
  );

  draw("Submitting party", { size: 10, bold: true, gap: 2 });
  draw(
    `${job.client.name} (${job.client.role})${job.client.email ? ` · ${job.client.email}` : ""}`,
    { size: 9, color: muted, gap: 8 }
  );

  draw("Student reviewer", { size: 10, bold: true, gap: 2 });
  const school = job.student?.studentProfile?.lawSchool;
  draw(
    job.student
      ? `${job.student.name}${school ? ` · ${school}` : ""}`
      : "—",
    { size: 9, color: muted, gap: 2 }
  );
  if (job.review?.submittedAt) {
    draw(
      `Review completed: ${new Date(job.review.submittedAt).toISOString()}`,
      { size: 9, color: muted, gap: 12 }
    );
  }

  draw("Scope of review", { size: 11, bold: true, gap: 4 });
  draw(CERTIFICATE_BOILERPLATE.limitedScope, {
    size: 9,
    color: muted,
    gap: 6,
  });
  draw(CERTIFICATE_BOILERPLATE.limitedSubmissionNote, {
    size: 9,
    color: muted,
    gap: 6,
  });
  draw(CERTIFICATE_BOILERPLATE.postFilingNote, {
    size: 9,
    color: muted,
    gap: 6,
  });
  draw(CERTIFICATE_BOILERPLATE.mayFileOrRetain, {
    size: 9,
    color: muted,
    gap: 12,
  });

  draw("Liability", { size: 11, bold: true, gap: 4 });
  for (const para of [
    CERTIFICATE_BOILERPLATE.liability,
    CERTIFICATE_BOILERPLATE.nonDelegable,
    CERTIFICATE_BOILERPLATE.noResponsibility,
    CERTIFICATE_BOILERPLATE.notLegalAdvice,
  ]) {
    draw(`• ${para}`, { size: 9, color: muted, gap: 6 });
  }

  draw("Confidentiality", { size: 11, bold: true, gap: 4 });
  draw(CERTIFICATE_BOILERPLATE.confidentiality, {
    size: 9,
    color: muted,
    gap: 12,
  });

  draw("Funds", { size: 11, bold: true, gap: 4 });
  draw(FUNDS_HOLD_COPY.releaseOnCertificate, {
    size: 9,
    color: muted,
    gap: 12,
  });

  if (job.review?.findings) {
    draw("Review summary", { size: 11, bold: true, gap: 4 });
    const findings = Array.isArray(job.review.findings)
      ? job.review.findings
      : [];
    draw(`Findings recorded: ${findings.length}`, {
      size: 9,
      color: muted,
      gap: 4,
    });
    findings.slice(0, 12).forEach((f: unknown, i: number) => {
      const row = f as {
        code?: string;
        citationText?: string;
        notes?: string;
      };
      draw(
        `${i + 1}. [${row.code || "—"}] ${row.citationText || "(no citation text)"}${row.notes ? ` — ${row.notes}` : ""}`,
        { size: 8, color: muted, gap: 3 }
      );
    });
    if (findings.length > 12) {
      draw(`… and ${findings.length - 12} more (see platform record)`, {
        size: 8,
        color: muted,
        gap: 4,
      });
    }
    if (job.review.overallNotes) {
      draw(`Overall notes: ${job.review.overallNotes}`, {
        size: 9,
        color: muted,
        gap: 10,
      });
    }
  }

  ensureSpace(40);
  page.drawLine({
    start: { x: margin, y },
    end: { x: 612 - margin, y },
    thickness: 1,
    color: rgb(0.89, 0.88, 0.85),
  });
  y -= 14;

  draw(
    `Disclaimer copy version: ${DISCLAIMER_COPY_VERSION}. This certificate is generated automatically by 2dcite upon completion of independent student review. It is not a court seal, not a warranty, and not legal advice.`,
    { size: 8, color: muted, gap: 8 }
  );
  draw("2dcite · 2dcite.com", { size: 9, color: muted, gap: 0 });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/**
 * Issue certificate + release held student payout + mark job CERTIFIED.
 * Idempotent if already certified.
 */
export async function issueCertificateAndReleaseFunds(jobId: string) {
  const existing = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      certificate: true,
      payout: true,
      review: true,
      client: true,
      student: { include: { studentProfile: true } },
    },
  });

  if (!existing) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }

  if (existing.certificate && existing.status === "CERTIFIED") {
    return existing;
  }

  if (!existing.review) {
    throw Object.assign(new Error("Review required before certificate"), {
      status: 400,
    });
  }

  const issuedAt = new Date();
  const certNumber =
    existing.certificate?.certNumber ?? generateCertNumber();

  let pdfKey = existing.certificate?.pdfKey ?? null;
  if (!pdfKey) {
    const pdfBuf = await renderCertificatePdf(
      {
        id: existing.id,
        title: existing.title,
        turnaroundTier: existing.turnaroundTier,
        completedAt: existing.completedAt,
        client: {
          name: existing.client.name,
          role: existing.client.role,
          email: existing.client.email,
        },
        student: existing.student
          ? {
              name: existing.student.name,
              studentProfile: existing.student.studentProfile,
            }
          : null,
        review: existing.review,
      },
      certNumber,
      issuedAt
    );
    pdfKey = `certificates/${existing.id}/${certNumber}.pdf`;
    await saveUpload(pdfKey, pdfBuf, "application/pdf");
  }

  const result = await prisma.$transaction(async (tx) => {
    const again = await tx.certificate.findUnique({ where: { jobId } });
    if (!again) {
      await tx.certificate.create({
        data: {
          jobId,
          certNumber,
          pdfKey,
          issuedAt,
          scopeVersion: DISCLAIMER_COPY_VERSION,
          documentTitle: existing.title,
          clientName: existing.client.name,
          clientRole: existing.client.role,
          studentName: existing.student?.name ?? null,
          lawSchool: existing.student?.studentProfile?.lawSchool || null,
        },
      });
    } else if (!again.pdfKey && pdfKey) {
      await tx.certificate.update({
        where: { id: again.id },
        data: { pdfKey },
      });
    }

    const payout = await tx.payout.findUnique({ where: { jobId } });
    if (payout && payout.status === "HELD") {
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: "RELEASED",
          releasedAt: issuedAt,
          studentId: existing.studentId,
        },
      });
    }

    const job = await tx.job.update({
      where: { id: jobId },
      data: {
        status: "CERTIFIED",
        completedAt: existing.completedAt ?? issuedAt,
        certifiedAt: existing.certifiedAt ?? issuedAt,
      },
      include: {
        payment: true,
        payout: true,
        certificate: true,
        review: true,
        student: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: existing.studentId,
        action: "job.certified_and_released",
        entityType: "Job",
        entityId: jobId,
        metadata: {
          certNumber,
          payoutStatus: "RELEASED",
          studentAmountCents: payout?.studentAmountCents ?? null,
        },
      },
    });

    return job;
  });

  await writeAudit({
    actorId: existing.studentId,
    action: "certificate.issued",
    entityType: "Certificate",
    entityId: result.certificate?.id,
    metadata: { certNumber, jobId },
  });

  return result;
}
