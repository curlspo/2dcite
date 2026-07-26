import { prisma } from "@2dcite/db";
import { createJobSchema, ClientPlatform } from "@2dcite/shared";
import { requireUser } from "@/lib/session";
import { uploadExists } from "@/lib/storage";
import { writeAudit } from "@/lib/audit";
import {
  feeForTier,
  serializeJob,
  validateClientAcknowledgments,
} from "@/lib/jobs";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

/** GET /jobs — client's jobs, or student's assigned jobs */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    if (user.role === "ADMIN") {
      const jobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          payment: true,
          payout: true,
          certificate: true,
          student: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      return jsonOk({ jobs: jobs.map(serializeJob) });
    }

    if (user.role === "STUDENT") {
      const jobs = await prisma.job.findMany({
        where: { studentId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          payment: true,
          payout: true,
          certificate: true,
          student: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      return jsonOk({ jobs: jobs.map(serializeJob) });
    }

    if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
      return jsonError("Forbidden", 403, "FORBIDDEN");
    }

    const jobs = await prisma.job.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        payout: true,
        certificate: true,
        student: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    return jsonOk({ jobs: jobs.map(serializeJob) });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /jobs — create job (AWAITING_PAYMENT), store liability acks */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (user.role !== "ATTORNEY" && user.role !== "JUDGE") {
      return jsonError(
        "Only attorneys and judges can submit jobs",
        403,
        "FORBIDDEN"
      );
    }

    const body = createJobSchema.parse(await request.json());
    const ack = validateClientAcknowledgments(body.acknowledgments);
    if (!ack.ok) {
      return jsonError(ack.error, 400, "ACK_REQUIRED");
    }

    if (!(await uploadExists(body.pdfKey))) {
      return jsonError("PDF upload not found", 400, "UPLOAD_MISSING");
    }
    if (!body.pdfKey.includes(user.id)) {
      return jsonError("Invalid PDF key for this user", 400, "UPLOAD_OWNER");
    }

    const fees = feeForTier(body.turnaroundTier);
    const platform =
      body.acknowledgments.platform === ClientPlatform.IOS ? "IOS" : "WEB";

    const job = await prisma.$transaction(async (tx) => {
      const created = await tx.job.create({
        data: {
          clientId: user.id,
          title: body.title.trim(),
          instructions: body.instructions?.trim() || null,
          status: "AWAITING_PAYMENT",
          turnaroundTier: body.turnaroundTier,
          pdfKey: body.pdfKey,
          pdfFileName: body.pdfKey.split("/").pop() || null,
          baseFeeCents: fees.baseFeeCents,
          rushFeeCents: fees.rushFeeCents,
          grossFeeCents: fees.grossCents,
          platformFeeCents: fees.platformFeeCents,
          studentFeeCents: fees.studentAmountCents,
          payment: {
            create: {
              amountCents: fees.grossCents,
              status: "PENDING",
            },
          },
          acknowledgments: {
            create: {
              userId: user.id,
              copyVersion: body.acknowledgments.copyVersion,
              acceptedIds: body.acknowledgments.acceptedIds as unknown as object,
              platform,
            },
          },
        },
        include: {
          payment: true,
          payout: true,
          certificate: true,
          student: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      return created;
    });

    await writeAudit({
      actorId: user.id,
      action: "job.create",
      entityType: "Job",
      entityId: job.id,
      metadata: {
        turnaroundTier: body.turnaroundTier,
        grossFeeCents: fees.grossCents,
      },
    });

    return jsonOk({ job: serializeJob(job) }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
