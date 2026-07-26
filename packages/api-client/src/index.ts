import type { HealthResponse, MeResponse } from "@2dcite/shared";

export type ApiClientOptions = {
  baseUrl: string;
  /** Bearer session token for mobile / API clients */
  getToken?: () => string | null | Promise<string | null>;
  /** Optional fetch override (React Native polyfills, tests) */
  fetch?: typeof fetch;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(options: ApiClientOptions) {
  const fetchFn = options.fetch ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = options.getToken ? await options.getToken() : null;
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetchFn(`${options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new ApiError(
        res.status,
        (data && data.error) || res.statusText || "Request failed",
        data
      );
    }
    return data as T;
  }

  return {
    health: () => request<HealthResponse>("/health"),
    me: () => request<MeResponse>("/me"),
    // Auth, jobs, reviews, etc. added in later phases
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
