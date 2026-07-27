import "server-only";
import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Upload storage (OWASP roadmap: private blobs).
 * - BLOB_READ_WRITE_TOKEN set → Vercel Blob with access: "private"
 * - Else → local disk under UPLOAD_DIR
 *
 * Reads always go through this module (authenticated API), never public URLs.
 */

function uploadRoot() {
  return (
    process.env.UPLOAD_DIR ||
    path.join(process.cwd(), "../../.uploads")
  );
}

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function newObjectKey(prefix: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = randomBytes(12).toString("hex");
  const cleanPrefix = prefix
    .replace(/\\/g, "/")
    .split("/")
    .filter((p) => p && p !== "." && p !== "..")
    .join("/");
  return `${cleanPrefix}/${id}-${safe}`;
}

export function assertSafeStorageKey(key: string): void {
  if (!key || key.length > 512) {
    throw Object.assign(new Error("Invalid storage key"), { status: 400 });
  }
  if (
    key.includes("\0") ||
    key.includes("..") ||
    key.startsWith("/") ||
    key.includes("\\")
  ) {
    throw Object.assign(new Error("Invalid storage key"), { status: 400 });
  }
  if (!key.startsWith("users/") && !key.startsWith("certificates/")) {
    throw Object.assign(new Error("Invalid storage key"), { status: 400 });
  }
}

export async function saveUpload(
  key: string,
  data: Buffer,
  contentType?: string
): Promise<{ key: string; contentType?: string; url?: string }> {
  assertSafeStorageKey(key);
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    // Private: not world-readable; only accessible via token-authenticated get()
    const blob = await put(key, data, {
      access: "private",
      contentType: contentType || "application/octet-stream",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true,
    });
    return { key, contentType, url: blob.url };
  }

  const full = resolveLocalPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return { key, contentType };
}

function resolveLocalPath(key: string): string {
  assertSafeStorageKey(key);
  const root = path.resolve(uploadRoot());
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw Object.assign(new Error("Invalid storage key"), { status: 400 });
  }
  return full;
}

export async function readUpload(key: string): Promise<Buffer> {
  assertSafeStorageKey(key);
  if (useBlob()) {
    const { get } = await import("@vercel/blob");
    // Prefer pathname (key) with private access
    const result = await get(key, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result?.stream) {
      // Fallback: list by prefix for legacy public blobs during migration
      try {
        const { list } = await import("@vercel/blob");
        const listed = await list({
          prefix: key,
          limit: 5,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        const hit = listed.blobs.find(
          (b) => b.pathname === key || b.pathname.endsWith(key)
        );
        if (hit?.url) {
          const legacy = await fetch(hit.url);
          if (legacy.ok) {
            return Buffer.from(await legacy.arrayBuffer());
          }
        }
      } catch {
        /* fall through */
      }
      throw Object.assign(new Error("Blob not found"), { status: 404 });
    }
    const chunks: Buffer[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }

  return readFile(resolveLocalPath(key));
}

export async function uploadExists(key: string): Promise<boolean> {
  try {
    assertSafeStorageKey(key);
  } catch {
    return false;
  }
  if (useBlob()) {
    try {
      const { head } = await import("@vercel/blob");
      await head(key, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return true;
    } catch {
      try {
        const { list } = await import("@vercel/blob");
        const listed = await list({
          prefix: key,
          limit: 1,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return listed.blobs.some((b) => b.pathname === key);
      } catch {
        return false;
      }
    }
  }

  try {
    await access(resolveLocalPath(key));
    return true;
  } catch {
    return false;
  }
}

export function storageMode(): "blob-private" | "local" {
  return useBlob() ? "blob-private" : "local";
}
