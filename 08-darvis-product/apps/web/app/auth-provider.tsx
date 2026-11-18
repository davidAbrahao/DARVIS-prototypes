"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  authenticate,
  authenticatedApiRequest,
  endSession,
  renewSession,
  type AuthPayload,
  type AuthUser,
} from "../lib/auth-api";

export type AuthStatus = "checking" | "authenticated" | "anonymous" | "unavailable";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
  retrySession: () => Promise<void>;
  apiRequest: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const csrfTokenRef = useRef<string | null>(null);
  const restoreTask = useRef<Promise<void> | null>(null);
  const authChannel = useRef<BroadcastChannel | null>(null);

  const acceptSession = useCallback((payload: AuthPayload) => {
    accessTokenRef.current = payload.access_token;
    csrfTokenRef.current = payload.csrf_token;
    setAccessToken(payload.access_token);
    setUser(payload.user);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback((broadcast = false) => {
    accessTokenRef.current = null;
    csrfTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
    if (broadcast) {
      authChannel.current?.postMessage({ type: "signed_out" });
    }
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel("darvis-auth-events");
    authChannel.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        event.data.type === "signed_out"
      ) {
        clearSession();
      }
    };

    return () => {
      channel.close();
      if (authChannel.current === channel) {
        authChannel.current = null;
      }
    };
  }, [clearSession]);

  const retrySession = useCallback(async () => {
    if (restoreTask.current) {
      return restoreTask.current;
    }

    const task = (async () => {
      setStatus("checking");
      try {
        try {
          // A função coordena abas e busca o CSRF somente depois de obter a trava.
          const payload = await renewSession(csrfTokenRef.current);
          acceptSession(payload);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            clearSession();
            return;
          }
          throw error;
        }
      } catch {
        accessTokenRef.current = null;
        setAccessToken(null);
        setUser(null);
        setStatus("unavailable");
      }
    })();

    restoreTask.current = task;
    try {
      await task;
    } finally {
      if (restoreTask.current === task) {
        restoreTask.current = null;
      }
    }
  }, [acceptSession, clearSession]);

  useEffect(() => {
    void retrySession();
  }, [retrySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setStatus("checking");
      try {
        const payload = await authenticate(email, password);
        acceptSession(payload);
      } catch (error) {
        if (error instanceof ApiError) {
          clearSession();
        } else {
          setStatus("unavailable");
        }
        throw error;
      }
    },
    [acceptSession, clearSession],
  );

  const apiRequest = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = accessTokenRef.current;
      if (!token) {
        throw new ApiError("Sua sessão não está autenticada.", 401);
      }

      try {
        return await authenticatedApiRequest<T>(path, init, {
          accessToken: token,
          csrfToken: csrfTokenRef.current,
          getLatestAccessToken: () => accessTokenRef.current,
          onSessionRenewed: acceptSession,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession(true);
        } else if (!(error instanceof ApiError)) {
          setStatus("unavailable");
        }
        throw error;
      }
    },
    [acceptSession, clearSession],
  );

  const signOut = useCallback(async () => {
    await endSession(csrfTokenRef.current);
    clearSession(true);
  }, [clearSession]);

  const signOutAll = useCallback(async () => {
    await apiRequest<void>("/auth/logout-all", { method: "POST" });
    clearSession(true);
  }, [apiRequest, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      signIn,
      signOut,
      signOutAll,
      retrySession,
      apiRequest,
    }),
    [status, user, accessToken, signIn, signOut, signOutAll, retrySession, apiRequest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  }
  return context;
}
