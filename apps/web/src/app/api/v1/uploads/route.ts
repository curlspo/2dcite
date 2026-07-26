import { requireUser } from "@/lib/session";
import { newObjectKey, saveUpload } from "@/lib/storage";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * POST multipart form: file + optional purpose (student-proof | job-pdf)
 * Returns { key } for use in application / job create.
 * Local disk in Phase 1; S3/R2 later with same response shape.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");
    const purpose = String(form.get("purpose") || "general");

    if (!(file instanceof File)) {
      return jsonError("file is required", 400, "FILE_REQUIRED");
    }
    if (file.size > MAX_BYTES) {
      return jsonError("File exceeds 20MB limit", 400, "FILE_TOO_LARGE");
    }
    const type = file.type || "application/octet-stream";
    if (!ALLOWED.has(type) && !file.name.toLowerCase().endsWith(".pdf")) {
      return jsonError(
        "Only PDF, PNG, JPEG, or Word documents are allowed",
        400,
        "FILE_TYPE"
      );
    }

    const prefix = `users/${user.id}/${purpose}`;
    const key = newObjectKey(prefix, file.name);
    const buf = Buffer.from(await file.arrayBuffer());
    await saveUpload(key, buf, type);

    return jsonOk({ key, fileName: file.name, size: file.size, contentType: type });
  } catch (err) {
    return handleRouteError(err);
  }
}
