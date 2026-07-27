import { requireUser } from "@/lib/session";
import { newObjectKey, saveUpload } from "@/lib/storage";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimitPaidApi } from "@/lib/rate-limit";
import { sanitizeSingleLine } from "@2dcite/shared";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_PURPOSES = new Set([
  "general",
  "job-pdf",
  "student-proof",
  "enrollment",
  "legal-writing",
  "professor-rec",
]);

/**
 * POST multipart — stores file in Vercel Blob (paid storage API).
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const ip = clientIp(request);
    const paidRl = await rateLimitPaidApi("blobWrite", {
      userId: user.id,
      ip,
    });
    if (!paidRl.ok) {
      return jsonError(
        "Too many uploads. Try again later.",
        429,
        "RATE_LIMITED",
        { retryAfterSec: paidRl.retryAfterSec }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    let purpose = sanitizeSingleLine(String(form.get("purpose") || "general"));
    if (!ALLOWED_PURPOSES.has(purpose)) {
      purpose = "general";
    }

    if (!(file instanceof File)) {
      return jsonError("file is required", 400, "FILE_REQUIRED");
    }
    if (file.size > MAX_BYTES) {
      return jsonError("File exceeds 20MB limit", 400, "FILE_TOO_LARGE");
    }
    if (file.size === 0) {
      return jsonError("Empty file", 400, "FILE_EMPTY");
    }
    const type = file.type || "application/octet-stream";
    const safeName = sanitizeSingleLine(file.name || "upload.pdf").slice(0, 180);
    if (!ALLOWED.has(type) && !safeName.toLowerCase().endsWith(".pdf")) {
      return jsonError(
        "Only PDF, PNG, JPEG, or Word documents are allowed",
        400,
        "FILE_TYPE"
      );
    }

    // Path traversal defense: never use raw client path segments
    const prefix = `users/${user.id}/${purpose}`;
    const key = newObjectKey(prefix, safeName);
    const buf = Buffer.from(await file.arrayBuffer());
    await saveUpload(key, buf, type);

    return jsonOk({
      key,
      fileName: safeName,
      size: file.size,
      contentType: type,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
