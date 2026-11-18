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

export type AuthenticatedRequestSession = {
  accessToken: string;
  csrfToken: string | null;
  getLatestAccessToken: () => string | null;
  onSessionRenewed: (payload: AuthPayload) => void;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_DARVIS_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

let refreshInFlight: Promise<AuthPayload> | null = null;

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

function endpoint(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("O caminho da API deve ser relativo à origem configurada.");
  }
  return `${API_BASE_URL}${path}`;
}

async function request(
  path: string,
  init: RequestInit,
  accessToken?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(endpoint(path), {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

async function postRefresh(csrfToken: string): Promise<AuthPayload> {
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

async function renewWithBrowserLock(fallbackCsrfToken: string | null): Promise<AuthPayload> {
  const performRefresh = async () => {
    // Releitura após adquirir a trava: outra aba pode ter acabado de rotacionar o cookie.
    let csrfToken: string | null = null;
    try {
      csrfToken = await bootstrapCsrf();
    } catch {
      csrfToken = fallbackCsrfToken;
    }

    if (!csrfToken) {
      throw new ApiError("Não foi possível recuperar a proteção da sessão.", 403);
    }
    return postRefresh(csrfToken);
  };

  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("darvis-session-refresh", performRefresh);
  }
  return performRefresh();
}

async function renewOnce(csrfToken: string | null): Promise<AuthPayload> {
  if (!refreshInFlight) {
    refreshInFlight = renewWithBrowserLock(csrfToken);
  }

  const operation = refreshInFlight;
  try {
    return await operation;
  } finally {
    if (refreshInFlight === operation) {
      refreshInFlight = null;
    }
  }
}

export async function renewSession(csrfToken: string | null): Promise<AuthPayload> {
  return renewOnce(csrfToken);
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

export async function authenticatedApiRequest<T>(
  path: string,
  init: RequestInit,
  session: AuthenticatedRequestSession,
): Promise<T> {
  let token = session.accessToken;
  let response = await request(path, init, token);

  if (response.status === 401) {
    const latestToken = session.getLatestAccessToken();
    if (latestToken && latestToken !== token) {
      token = latestToken;
      response = await request(path, init, token);
    }

    if (response.status === 401) {
      const renewed = await renewOnce(session.csrfToken);
      session.onSessionRenewed(renewed);
      token = renewed.access_token;
      response = await request(path, init, token);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return readJson<T>(response);
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
