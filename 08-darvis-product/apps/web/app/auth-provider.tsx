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
  bootstrapCsrf,
  endAllSessions,
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

  const acceptSession = useCallback((payload: AuthPayload) => {
    accessTokenRef.current = payload.access_token;
    csrfTokenRef.current = payload.csrf_token;
    setAccessToken(payload.access_token);
    setUser(payload.user);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    csrfTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const retrySession = useCallback(async () => {
    if (restoreTask.current) {
      return restoreTask.current;
    }

    const task = (async () => {
      setStatus("checking");
      try {
        const csrf = await bootstrapCsrf();
        csrfTokenRef.current = csrf;

        try {
          const payload = await renewSession(csrf);
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
          clearSession();
        } else if (!(error instanceof ApiError)) {
          setStatus("unavailable");
        }
        throw error;
      }
    },
    [acceptSession, clearSession],
  );

  const signOut = useCallback(async () => {
    const csrf = csrfTokenRef.current ?? (await bootstrapCsrf());
    await endSession(csrf);
    clearSession();
  }, [clearSession]);

  const signOutAll = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) {
      throw new ApiError("Sua sessão não está mais autenticada.", 401);
    }
    await endAllSessions(token);
    clearSession();
  }, [clearSession]);

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
