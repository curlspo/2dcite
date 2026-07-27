/**
 * Browser / client-safe API helper only.
 * Never import server modules (stripe, password, storage, etc.) here.
 * Never read secret env vars — only relative /api paths in the browser.
 */

/** Always same-origin in the browser so no API host/key config is required client-side. */
function apiBase(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  // SSR of client components: relative still works against the request host
  return "/api/v1";
}

/** Client-side generic messages — never surface raw server HTML/text dumps. */
function clientGenericMessage(status: number): string {
  if (status === 401) return "Unable to sign in or session expired.";
  if (status === 403) return "You do not have access.";
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status >= 500) return "Something went wrong. Please try again later.";
  return "Unable to complete this request.";
}

export class BrowserApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "BrowserApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new BrowserApiError(
      0,
      "Something went wrong. Please try again later."
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    let msg = clientGenericMessage(res.status);
    if (
      data &&
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      const serverMsg = String((data as { error: string }).error).trim();
      if (
        serverMsg &&
        serverMsg.length < 200 &&
        !serverMsg.includes("\n") &&
        !/at\s+\S+\s+\(/.test(serverMsg) &&
        !/Error:|Exception|stack/i.test(serverMsg) &&
        // Never surface anything that looks like a key
        !/\b(sk_|pk_|whsec_|api[_-]?key)\b/i.test(serverMsg)
      ) {
        msg = serverMsg;
      }
    }
    throw new BrowserApiError(res.status, msg, data);
  }

  return data as T;
}
