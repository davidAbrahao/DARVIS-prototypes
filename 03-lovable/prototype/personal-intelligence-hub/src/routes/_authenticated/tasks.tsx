import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/darvis/ui";
import { tasks as seed } from "@/lib/darvis-data";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tarefas — D.A.R.V.I.S." },
      { name: "description", content: "Gestão de tarefas, compromissos e atividades do dia a dia." },
      { property: "og:title", content: "Tarefas — D.A.R.V.I.S." },
      { property: "og:description", content: "Gestão de tarefas, compromissos e atividades do dia a dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tasks,
});

function Tasks() {
  const [items, setItems] = useState(seed);
  const [title, setTitle] = useState("");
  const toggle = (id: number) => setItems((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const add = () => { if (!title.trim()) return; setItems((l) => [{ id: Date.now(), title, due: "Sem prazo", priority: "média", done: false, project: "Pessoal" }, ...l]); setTitle(""); };
  return (
    <div>
      <PageHeader eyebrow="Personal Management" title="Tarefas" desc="Funciona nesta sessão; alterações não são salvas até a Fase 3." status="simulado" />
      <form className="mb-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa…" className="flex-1 rounded-xl border bg-surface px-4 py-3 text-sm outline-none focus:border-primary/60" />
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="size-4" />Adicionar</button>
      </form>
      <Panel>
        <ul className="divide-y">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <button onClick={() => toggle(t.id)} aria-label="Concluir" className={`grid size-5 place-items-center rounded border ${t.done ? "border-success bg-success text-primary-foreground" : "hover:border-primary"}`}>{t.done && <Check className="size-3" />}</button>
              <div className="flex-1">
                <p className={`text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                <p className="font-mono text-xs text-muted-foreground">{t.project} · prioridade {t.priority}</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{t.due}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
