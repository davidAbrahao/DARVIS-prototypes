"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Fingerprint, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";

import { ApiError } from "../../lib/auth-api";
import { useAuth } from "../auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { status, signIn, retrySession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await signIn(email, password);
      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Não foi possível conectar à API. Verifique a conexão e tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-ambient auth-ambient-one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-two" aria-hidden="true" />
      <section className="auth-card">
        <a className="auth-brand" href="/" aria-label="D.A.R.V.I.S.">
          <span className="auth-brand-mark"><Activity size={22} /></span>
          <span><strong>D.A.R.V.I.S.</strong><small>SISTEMA COGNITIVO</small></span>
        </a>

        <div className="auth-heading">
          <span className="auth-eyebrow"><span /> ACESSO AO AMBIENTE PESSOAL</span>
          <h1>Bem-vindo<br /><span>de volta.</span></h1>
          <p>Entre para continuar de onde sua inteligência pessoal parou.</p>
        </div>

        {status === "checking" ? (
          <div className="auth-checking" role="status" aria-live="polite">
            <RefreshCw size={17} className="auth-spin" />
            <span>Verificando a sessão segura…</span>
          </div>
        ) : (
          <>
            {status === "unavailable" ? (
              <div className="auth-alert" role="status">
                <ShieldCheck size={17} />
                <div>
                  <strong>API ainda não confirmada</strong>
                  <span>Você pode tentar entrar; a sessão só será aberta após a confirmação do servidor.</span>
                </div>
                <button type="button" onClick={() => void retrySession()} aria-label="Verificar conexão novamente">
                  <RefreshCw size={15} />
                </button>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="auth-error" role="alert">{errorMessage}</div>
            ) : null}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="email">E-MAIL</label>
              <div className="auth-input-wrap">
                <Fingerprint size={17} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  required
                />
              </div>

              <div className="auth-password-label">
                <label htmlFor="password">SENHA</label>
                <LockKeyhole size={14} />
              </div>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Sua senha de acesso"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  maxLength={128}
                  required
                />
              </div>

              <button className="auth-primary-button" type="submit" disabled={submitting}>
                {submitting ? "Autenticando…" : "Acessar meu ambiente"}
                <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}

        <div className="auth-security-note">
          <ShieldCheck size={15} />
          <span>Sessão gerenciada pelo servidor · access token em memória</span>
        </div>
      </section>
      <footer className="auth-footer">D.A.R.V.I.S. <span>·</span> INTELIGÊNCIA PESSOAL SOB SEU CONTROLE</footer>
    </main>
  );
}
