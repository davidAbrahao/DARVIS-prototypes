import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Core, PageHeader } from "@/components/darvis/ui";

export const Route = createFileRoute("/_authenticated/assistant")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({
    meta: [
      { title: "Assistente — D.A.R.V.I.S." },
      { name: "description", content: "Converse com a inteligência central do D.A.R.V.I.S." },
      { property: "og:title", content: "Assistente — D.A.R.V.I.S." },
      { property: "og:description", content: "Converse com a inteligência central do D.A.R.V.I.S." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assistant,
});

type Msg = { role: "user" | "ai"; text: string };

function reply(text: string) {
  return `[Resposta simulada] Recebi: "${text}". A conexão real com o Gemini chega na Fase 4 — por enquanto, nenhuma ação foi executada.`;
}

function Assistant() {
  const { q } = Route.useSearch();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: "Olá, David. Sou o D.A.R.V.I.S. Neste protótipo minhas respostas são simuladas." }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const sent = useRef(false);
  const end = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => { setMsgs((m) => [...m, { role: "ai", text: reply(text) }]); setThinking(false); }, 900);
  };
  useEffect(() => { if (q && !sent.current) { sent.current = true; send(q); } }, [q]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, thinking]);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <PageHeader eyebrow="AI Assistant" title="Assistente" status="simulado" />
      <div className="panel flex-1 space-y-4 overflow-y-auto p-5">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-surface"}`}>{m.text}</div>
          </div>
        ))}
        {thinking && <div className="flex items-center gap-3 text-xs text-muted-foreground"><Core size={28} /> processando…</div>}
        <div ref={end} />
      </div>
      <form className="mt-4 flex gap-2 rounded-xl border bg-surface p-2 focus-within:border-primary/60" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite sua mensagem…" className="flex-1 bg-transparent px-3 text-sm outline-none" />
        <button className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground" aria-label="Enviar"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
