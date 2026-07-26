import type {
  HealthResponse,
  LoginBody,
  MeResponse,
  RegisterBody,
  StudentApplicationBody,
  SubmitReviewBody,
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

export type JobDto = {
  id: string;
  title: string;
  instructions?: string | null;
  status: string;
  turnaroundTier: string;
  grossFeeCents: number;
  grossFeeDisplay?: string;
  studentFeeCents?: number;
  dueAt?: string | null;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  certifiedAt?: string | null;
  createdAt: string;
  pdfFileName?: string | null;
  payment?: { status: string; paidAt?: string | null } | null;
  payout?: {
    status: string;
    studentAmountCents: number;
    releasedAt?: string | null;
  } | null;
  certificate?: {
    id: string;
    certNumber: string;
    issuedAt: string;
  } | null;
  review?: {
    id: string;
    findings: unknown;
    overallNotes?: string | null;
    submittedAt: string;
  } | null;
  student?: { id: string; name: string } | null;
  client?: { id: string; name: string; email: string; role: string } | null;
};

export function createApiClient(options: ApiClientOptions) {
  const fetchFn = options.fetch ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = options.getToken ? await options.getToken() : null;
    const headers = new Headers(init.headers);
    const isForm =
      typeof FormData !== "undefined" && init.body instanceof FormData;
    if (init.body && !isForm && !headers.has("Content-Type")) {
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
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
    }

    if (!res.ok) {
      let message = res.statusText || "Request failed";
      if (
        data &&
        typeof data === "object" &&
        data !== null &&
        "error" in data
      ) {
        message = String((data as { error: unknown }).error);
      }
      throw new ApiError(res.status, message, data);
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
    logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),

    pricing: () =>
      request<{
        disclaimerCopyVersion: string;
        acknowledgments: { id: string; text: string }[];
        tiers: Record<
          string,
          { display: string; grossCents: number; label: string }
        >;
        stripeEnabled: boolean;
        fundsHold: Record<string, string>;
      }>("/pricing"),

    listJobs: () => request<{ jobs: JobDto[] }>("/jobs"),
    getJob: (id: string) => request<{ job: JobDto }>(`/jobs/${id}`),
    createJob: (body: unknown) =>
      request<{ job: JobDto }>("/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    checkoutJob: (id: string, body?: { devMock?: boolean }) =>
      request<{ mode: string; url?: string; job?: JobDto; message?: string }>(
        `/jobs/${id}/checkout`,
        {
          method: "POST",
          body: JSON.stringify(body ?? {}),
        }
      ),
    acceptJob: (id: string) =>
      request<{ job: JobDto }>(`/jobs/${id}/accept`, { method: "POST" }),
    declineJob: (id: string) =>
      request<{ ok: boolean; job: JobDto | null }>(`/jobs/${id}/decline`, {
        method: "POST",
      }),
    submitReview: (id: string, body: SubmitReviewBody) =>
      request<{
        job: JobDto;
        message: string;
        certificate?: { certNumber: string; downloadPath: string };
      }>(`/jobs/${id}/review`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getCertificateMeta: (id: string) =>
      request<{
        certificate: {
          certNumber: string;
          issuedAt: string;
          downloadPath: string;
        };
        payout: { status: string } | null;
        jobStatus: string;
      }>(`/jobs/${id}/certificate`),

    listAssignments: () =>
      request<{
        eligibleForMatching: boolean;
        gateMessage: string | null;
        active: JobDto[];
        history: JobDto[];
      }>("/student/assignments"),

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

    /** Multipart upload; returns storage key */
    uploadFile: async (file: {
      uri: string;
      name: string;
      type: string;
    }, purpose: string) => {
      const token = options.getToken ? await options.getToken() : null;
      const form = new FormData();
      // React Native FormData file shape
      form.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
      form.append("purpose", purpose);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetchFn(`${options.baseUrl}/uploads`, {
        method: "POST",
        headers,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new ApiError(res.status, data?.error || "Upload failed", data);
      }
      return data as { key: string; fileName: string };
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
