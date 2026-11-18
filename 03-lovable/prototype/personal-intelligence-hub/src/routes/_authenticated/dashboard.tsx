import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Send } from "lucide-react";
import { Core, Panel, Progress, StatusBadge } from "@/components/darvis/ui";
import { activity, events, integrations, memories, projects, tasks, automations } from "@/lib/darvis-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — D.A.R.V.I.S." },
      { name: "description", content: "Central de comando do D.A.R.V.I.S.: tarefas, projetos, memória e integrações." },
      { property: "og:title", content: "Command Center — D.A.R.V.I.S." },
      { property: "og:description", content: "Central de comando do D.A.R.V.I.S.: tarefas, projetos, memória e integrações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function greeting(h: number) {
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Index() {
  const [hello, setHello] = useState("Olá");
  const [q, setQ] = useState("");
  const nav = useNavigate();
  useEffect(() => setHello(greeting(new Date().getHours())), []);
  const pending = tasks.filter((t) => !t.done);
  return (
    <div className="space-y-6">
      <section className="panel relative overflow-hidden p-6 md:p-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <Core size={96} />
          <div className="flex-1">
            <p className="label-mono text-primary">Núcleo online · modo protótipo</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{hello}, David.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Você tem {pending.length} tarefas pendentes e {events.length} compromissos hoje.</p>
          </div>
        </div>
        <form className="mt-8 flex items-center gap-2 rounded-xl border bg-surface p-2 focus-within:border-primary/60"
          onSubmit={(e) => { e.preventDefault(); nav({ to: "/assistant", search: { q: q || undefined } }); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pergunte ou peça algo ao D.A.R.V.I.S.…"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground" />
          <button className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground" aria-label="Enviar"><Send className="size-4" /></button>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Tarefas de hoje" status="simulado" className="lg:col-span-2" action={<Link to="/tasks" className="text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link>}>
          <ul className="divide-y">
            {pending.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{t.title}</span><span className="shrink-0 font-mono text-xs text-muted-foreground">{t.due}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Agenda" status="simulado">
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.time} className="flex gap-3 text-sm"><span className="font-mono text-primary">{e.time}</span>{e.title}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Projetos ativos" status="simulado" action={<Link to="/projects" className="text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => (
            <div key={p.id} className="rounded-lg border bg-surface p-4">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="mb-3 text-xs text-muted-foreground">{p.phase}</p>
              <Progress value={p.progress} />
              <p className="mt-2 font-mono text-xs text-muted-foreground">{p.progress}%</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Atividade recente" status="simulado">
          <ul className="space-y-3">{activity.map((a) => <li key={a.text} className="text-sm"><p>{a.text}</p><p className="font-mono text-xs text-muted-foreground">{a.t}</p></li>)}</ul>
        </Panel>
        <Panel title="Memória" status="simulado" action={<Link to="/memory" className="text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link>}>
          <p className="text-3xl font-semibold">{memories.length}</p>
          <p className="mb-4 text-xs text-muted-foreground">registros fictícios</p>
          <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">{memories[1]?.text}</p>
        </Panel>
        <Panel title="Integrações & automações">
          <ul className="space-y-2 text-sm">
            {[...integrations.slice(0, 3), ...automations.slice(0, 2)].map((i) => (
              <li key={i.name} className="flex items-center justify-between"><span>{i.name}</span><StatusBadge status="planejado" /></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
