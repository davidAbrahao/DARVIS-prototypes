export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
};

export type AuthPayload = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  csrf_token: string;
  user: AuthUser;
};

type CsrfPayload = { csrf_token: string };

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_DARVIS_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
        ? payload.detail
        : "Não foi possível concluir a solicitação.";
    throw new ApiError(detail, response.status);
  }

  return payload as T;
}

export async function bootstrapCsrf(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await readJson<CsrfPayload>(response);
  return payload.csrf_token;
}

export async function authenticate(email: string, password: string): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return readJson<AuthPayload>(response);
}

export async function renewSession(csrfToken: string): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  return readJson<AuthPayload>(response);
}

export async function endSession(csrfToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });

  if (!response.ok) {
    await readJson<never>(response);
  }
}

export async function endAllSessions(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout-all`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await readJson<never>(response);
  }
}
