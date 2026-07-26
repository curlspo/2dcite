import type {
  HealthResponse,
  LoginBody,
  MeResponse,
  RegisterBody,
  StudentApplicationBody,
} from "@2dcite/shared";

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
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

export type AuthResponse = {
  token: string;
  user: MeResponse & {
    studentProfile?: unknown;
  };
};

export function createApiClient(options: ApiClientOptions) {
  const fetchFn = options.fetch ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = options.getToken ? await options.getToken() : null;
    const headers = new Headers(init.headers);
    if (
      init.body &&
      !(typeof FormData !== "undefined" && init.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
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
    register: (body: RegisterBody) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: LoginBody) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ ok: true }>("/auth/logout", { method: "POST" }),
    getStudentApplication: () =>
      request<{
        user: MeResponse;
        applicationComplete: boolean;
        eligibleForMatching: boolean;
      }>("/student/application"),
    submitStudentApplication: (body: StudentApplicationBody) =>
      request<{ user: MeResponse; message: string }>("/student/application", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    listAdminStudents: (status?: string) =>
      request<{ students: unknown[] }>(
        `/admin/students${status ? `?status=${status}` : ""}`
      ),
    approveStudent: (id: string) =>
      request(`/admin/students/${id}/approve`, { method: "POST" }),
    rejectStudent: (id: string, reason?: string) =>
      request(`/admin/students/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    pricing: () => request<Record<string, unknown>>("/pricing"),
    listJobs: () => request<{ jobs: unknown[] }>("/jobs"),
    getJob: (id: string) => request<{ job: unknown }>(`/jobs/${id}`),
    createJob: (body: unknown) =>
      request<{ job: { id: string } }>("/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    checkoutJob: (id: string, body?: { devMock?: boolean }) =>
      request<{ mode: string; url?: string; job?: unknown }>(
        `/jobs/${id}/checkout`,
        {
          method: "POST",
          body: JSON.stringify(body ?? {}),
        }
      ),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
