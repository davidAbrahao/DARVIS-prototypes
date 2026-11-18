import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/darvis/ui";
import { memories } from "@/lib/darvis-data";

export const Route = createFileRoute("/_authenticated/memory")({
  head: () => ({
    meta: [
      { title: "Memória — D.A.R.V.I.S." },
      { name: "description", content: "Central de memória persistente: registre, categorize e recupere informações." },
      { property: "og:title", content: "Memória — D.A.R.V.I.S." },
      { property: "og:description", content: "Central de memória persistente: registre, categorize e recupere informações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Memory,
});

function Memory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const cats = ["Todas", ...new Set(memories.map((m) => m.cat))];
  const list = memories.filter((m) => (cat === "Todas" || m.cat === cat) && m.text.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="Memory Center" title="Memória" desc="Registros fictícios. Persistência real chega na Fase 3; sync com Obsidian na Fase 6." status="simulado" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar na memória…" className="mb-4 w-full rounded-xl border bg-surface px-4 py-3 text-sm outline-none focus:border-primary/60" />
      <div className="mb-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs ${cat === c ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((m) => (
          <Panel key={m.id}>
            <div className="mb-2 flex justify-between"><span className="label-mono text-primary">{m.cat}</span><span className="font-mono text-xs text-muted-foreground">{m.date}</span></div>
            <p className="text-sm">{m.text}</p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">{m.links} conexões</p>
          </Panel>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma memória encontrada.</p>}
      </div>
    </div>
  );
}
