import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Core } from "@/components/darvis/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D.A.R.V.I.S. — Sistema de inteligência pessoal" },
      { name: "description", content: "David Abrahão Rodrigues Virtual Intelligence System: memória, tarefas, projetos e IA em uma central." },
      { property: "og:title", content: "D.A.R.V.I.S." },
      { property: "og:description", content: "Sistema de inteligência pessoal com memória, agentes e automações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard", replace: true }); });
  }, [nav]);
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center text-center">
        <Core size={140} />
        <h1 className="mt-8 font-mono text-3xl font-semibold tracking-[0.35em] md:text-5xl">D.A.R.V.I.S.</h1>
        <p className="label-mono mt-3">David Abrahão Rodrigues Virtual Intelligence System</p>
        <p className="mt-6 max-w-md text-sm text-muted-foreground">Memória, conhecimento, ferramentas e ações em uma única central de inteligência pessoal.</p>
        <Link to="/auth" className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow">Acessar sistema</Link>
      </div>
    </div>
  );
}
