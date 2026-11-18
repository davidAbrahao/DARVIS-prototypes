"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Activity, RefreshCw, ShieldAlert } from "lucide-react";

import { useAuth } from "./auth-provider";

export function ProtectedPage({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { status, retrySession } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "authenticated") {
    return children;
  }

  if (status === "unavailable") {
    return (
      <main className="auth-state-screen">
        <section className="auth-state-card" aria-live="polite">
          <span className="auth-state-icon warning"><ShieldAlert size={22} /></span>
          <span className="auth-eyebrow">CONEXÃO COM A API</span>
          <h1>Não foi possível confirmar sua sessão.</h1>
          <p>
            A API não respondeu como esperado. O access token não é salvo em armazenamento persistente; tente novamente quando a conexão estiver disponível.
          </p>
          <button className="auth-primary-button" onClick={() => void retrySession()}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-state-screen">
      <section className="auth-state-card" aria-live="polite">
        <span className="auth-state-icon"><Activity size={22} /></span>
        <span className="auth-eyebrow">D.A.R.V.I.S. · IDENTIDADE</span>
        <h1>Verificando sua sessão.</h1>
        <p>Conferindo a sessão segura com a API.</p>
        <span className="auth-loading-line" />
      </section>
    </main>
  );
}
