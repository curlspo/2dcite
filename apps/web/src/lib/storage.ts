import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Local file storage for Phase 1.
 * Production (Phase 2+) will swap to S3/R2 presigned URLs with the same key API.
 */

function uploadRoot() {
  return (
    process.env.UPLOAD_DIR ||
    path.join(process.cwd(), "../../.uploads")
  );
}

export function newObjectKey(prefix: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = randomBytes(12).toString("hex");
  return `${prefix}/${id}-${safe}`;
}

export async function saveUpload(
  key: string,
  data: Buffer,
  contentType?: string
): Promise<{ key: string; contentType?: string }> {
  const full = path.join(uploadRoot(), key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  // contentType stored only in key path for now; metadata file optional later
  void contentType;
  return { key, contentType };
}

export async function readUpload(key: string): Promise<Buffer> {
  const full = path.join(uploadRoot(), key);
  return readFile(full);
}

export async function uploadExists(key: string): Promise<boolean> {
  try {
    await access(path.join(uploadRoot(), key));
    return true;
  } catch {
    return false;
  }
}
