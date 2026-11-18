import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — D.A.R.V.I.S." },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Nova senha — D.A.R.V.I.S." },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    await logAction("auth.password_reset");
    toast.success("Senha atualizada.");
    nav({ to: "/dashboard", replace: true });
  };
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-8">
        <h1 className="text-xl font-semibold">Definir nova senha</h1>
        <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha" className="w-full rounded-xl border bg-surface px-4 py-3 text-sm outline-none focus:border-primary/60" />
        <button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">Salvar</button>
      </form>
    </div>
  );
}
