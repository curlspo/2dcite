import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Upload storage:
 * - If BLOB_READ_WRITE_TOKEN is set → Vercel Blob (production)
 * - Else → local disk under UPLOAD_DIR (development)
 *
 * Keys are always our logical keys; Blob stores with pathname = key.
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
  return `${prefix}/${id}-${safe}`;
}

/** Map logical key → Blob URL for private retrieval (stored alongside via meta key optional) */
const blobUrlMeta = new Map<string, string>();

export async function saveUpload(
  key: string,
  data: Buffer,
  contentType?: string
): Promise<{ key: string; contentType?: string; url?: string }> {
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, data, {
      access: "public", // certificates/docs need download; tighten with private + tokens later
      contentType: contentType || "application/octet-stream",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    // Persist URL mapping in a sidecar meta file on blob is overkill; store URL as key prefix
    // We encode: for blob mode, key remains logical; read uses head/list by pathname
    blobUrlMeta.set(key, blob.url);
    // Also write a small JSON pointer blob for cold starts
    try {
      await put(
        `${key}.url.json`,
        JSON.stringify({ url: blob.url, contentType }),
        {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );
    } catch {
      /* non-fatal */
    }
    return { key, contentType, url: blob.url };
  }

  const full = path.join(uploadRoot(), key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return { key, contentType };
}

export async function readUpload(key: string): Promise<Buffer> {
  if (useBlob()) {
    let url = blobUrlMeta.get(key);
    if (!url) {
      // Resolve via pointer object
      try {
        const pointerRes = await fetch(
          await resolveBlobUrl(`${key}.url.json`)
        );
        if (pointerRes.ok) {
          const meta = (await pointerRes.json()) as { url: string };
          url = meta.url;
          blobUrlMeta.set(key, url);
        }
      } catch {
        /* fall through */
      }
    }
    if (!url) {
      url = await resolveBlobUrl(key);
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Blob fetch failed for ${key}: ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  const full = path.join(uploadRoot(), key);
  return readFile(full);
}

async function resolveBlobUrl(pathname: string): Promise<string> {
  // If key was stored as full URL already
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }
  const { list } = await import("@vercel/blob");
  const result = await list({
    prefix: pathname,
    limit: 5,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  const hit = result.blobs.find(
    (b) => b.pathname === pathname || b.pathname.endsWith(pathname)
  );
  if (!hit) {
    throw new Error(`Blob not found: ${pathname}`);
  }
  return hit.url;
}

export async function uploadExists(key: string): Promise<boolean> {
  if (useBlob()) {
    try {
      await resolveBlobUrl(key);
      return true;
    } catch {
      try {
        const pointer = await resolveBlobUrl(`${key}.url.json`);
        return Boolean(pointer);
      } catch {
        return false;
      }
    }
  }

  try {
    await access(path.join(uploadRoot(), key));
    return true;
  } catch {
    return false;
  }
}

export function storageMode(): "blob" | "local" {
  return useBlob() ? "blob" : "local";
}
