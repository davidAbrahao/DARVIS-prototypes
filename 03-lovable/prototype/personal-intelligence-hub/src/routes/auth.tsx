import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Core } from "@/components/darvis/ui";
import { logAction } from "@/lib/audit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — D.A.R.V.I.S." },
      { name: "description", content: "Acesse sua central de inteligência pessoal." },
      { property: "og:title", content: "Entrar — D.A.R.V.I.S." },
      { property: "og:description", content: "Acesse sua central de inteligência pessoal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard", replace: true }); });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await logAction("auth.sign_in", { method: "password" });
        nav({ to: "/dashboard", replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
        if (error) throw error;
        setSent("Enviamos um link de confirmação para seu e-mail.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("Se o e-mail existir, você receberá um link para redefinir a senha.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Não foi possível entrar."); return; }
    if (r.redirected) return;
    await logAction("auth.sign_in", { method: provider });
    nav({ to: "/dashboard", replace: true });
  };

  const input = "w-full rounded-xl border bg-surface px-4 py-3 text-sm outline-none focus:border-primary/60";
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="panel w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Core size={64} />
          <p className="mt-4 font-mono text-sm tracking-[0.3em]">D.A.R.V.I.S.</p>
          <h1 className="mt-2 text-xl font-semibold">{mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}</h1>
        </div>
        {sent ? (
          <p className="text-center text-sm text-muted-foreground">{sent}</p>
        ) : (
          <>
            {mode !== "forgot" && (
              <div className="mb-5 space-y-2">
                <button type="button" onClick={() => social("google")} className="flex w-full items-center justify-center gap-2.5 rounded-xl border bg-surface px-4 py-2.5 text-sm hover:bg-muted">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  Continuar com Google
                </button>
                <button type="button" onClick={() => social("lovable")} className="flex w-full items-center justify-center gap-2.5 rounded-xl border bg-surface px-4 py-2.5 text-sm hover:bg-muted">
                  <LovableMark className="size-[18px]" />
                  Continuar com Lovable
                </button>
                <p className="label-mono pt-2 text-center">ou</p>
              </div>
            )}
            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && <input className={input} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />}
              <input className={input} type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              {mode !== "forgot" && <input className={input} type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />}
              <button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {busy ? "Aguarde…" : mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
              </button>
            </form>
          </>
        )}
        <div className="mt-5 flex justify-between text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button onClick={() => { setMode("signup"); setSent(null); }} className="hover:text-primary">Criar conta</button>
              <button onClick={() => { setMode("forgot"); setSent(null); }} className="hover:text-primary">Esqueci a senha</button>
            </>
          ) : (
            <button onClick={() => { setMode("signin"); setSent(null); }} className="hover:text-primary">Voltar para entrar</button>
          )}
        </div>
      </div>
    </div>
  );
}
