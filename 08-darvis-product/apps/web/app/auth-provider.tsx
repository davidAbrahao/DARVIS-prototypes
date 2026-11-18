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
  bootstrapCsrf,
  endAllSessions,
  endSession,
  renewSession,
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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const restoreTask = useRef<Promise<void> | null>(null);

  const acceptSession = useCallback((payload: {
    access_token: string;
    csrf_token: string;
    user: AuthUser;
  }) => {
    setAccessToken(payload.access_token);
    setCsrfToken(payload.csrf_token);
    setUser(payload.user);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
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
        setCsrfToken(csrf);

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
          // 401, 403 e 429 são respostas válidas da API, não falhas de conectividade.
          clearSession();
        } else {
          setStatus("unavailable");
        }
        throw error;
      }
    },
    [acceptSession, clearSession],
  );

  const signOut = useCallback(async () => {
    const csrf = csrfToken ?? (await bootstrapCsrf());
    await endSession(csrf);
    setCsrfToken(null);
    clearSession();
  }, [clearSession, csrfToken]);

  const signOutAll = useCallback(async () => {
    if (!accessToken) {
      throw new ApiError("Sua sessão não está mais autenticada.", 401);
    }
    await endAllSessions(accessToken);
    setCsrfToken(null);
    clearSession();
  }, [accessToken, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      signIn,
      signOut,
      signOutAll,
      retrySession,
    }),
    [status, user, accessToken, signIn, signOut, signOutAll, retrySession],
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
