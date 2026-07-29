import { prisma, applyRlsConfig, enterUserRls } from "@2dcite/db";
import { createJobSchema, ClientPlatform } from "@2dcite/shared";
import { requireUser } from "@/lib/session";
import { uploadExists } from "@/lib/storage";
import { writeAudit } from "@/lib/audit";
import { serializeJob, validateClientAcknowledgments } from "@/lib/jobs";
import { resolveJobPricingForUser } from "@/lib/membership";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

/** GET /jobs — client's jobs, or student's assigned jobs */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return enterUserRls(user, async () => {
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
      return jsonOk({ jobs: jobs.map((j) => serializeJob(j, user)) });
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
      return jsonOk({ jobs: jobs.map((j) => serializeJob(j, user)) });
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
    return jsonOk({ jobs: jobs.map((j) => serializeJob(j, user)) });
    });
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

    return enterUserRls(user, async () => {
    const isRush = body.turnaroundTier === "RUSH";
    const { pricing } = await resolveJobPricingForUser(user.id, isRush);
    const platform =
      body.acknowledgments.platform === ClientPlatform.IOS ? "IOS" : "WEB";

    const job = await prisma.$transaction(async (tx) => {
      await applyRlsConfig(tx, {
        mode: "user",
        userId: user.id,
        role: user.role,
      });
      const created = await tx.job.create({
        data: {
          clientId: user.id,
          title: body.title.trim(),
          instructions: body.instructions?.trim() || null,
          status: "AWAITING_PAYMENT",
          turnaroundTier: body.turnaroundTier,
          reviewScope: body.reviewScope,
          pdfKey: body.pdfKey,
          pdfFileName: body.pdfKey.split("/").pop() || null,
          baseFeeCents: pricing.baseFeeCents,
          rushFeeCents: pricing.rushFeeCents,
          grossFeeCents: pricing.grossCents,
          platformFeeCents: pricing.platformFeeCents,
          studentFeeCents: pricing.studentAmountCents,
          listGrossCents: pricing.listGrossCents,
          pricingMode: pricing.mode,
          payment: {
            create: {
              amountCents: pricing.grossCents,
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
        grossFeeCents: pricing.grossCents,
        listGrossCents: pricing.listGrossCents,
        pricingMode: pricing.mode,
      },
    });

    return jsonOk({ job: serializeJob(job, user) }, { status: 201 });
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
