import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusBadge } from "@/components/darvis/ui";
import { automations, integrations } from "@/lib/darvis-data";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrações — D.A.R.V.I.S." },
      { name: "description", content: "Conexões com Telegram, Google, GitHub, Gemini e automações." },
      { property: "og:title", content: "Integrações — D.A.R.V.I.S." },
      { property: "og:description", content: "Conexões com Telegram, Google, GitHub, Gemini e automações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Integrations,
});

function Integrations() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Integrations & Automation" title="Integrações" desc="Nenhum serviço está conectado ainda. Cada item indica a fase prevista." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <Panel key={i.name}>
            <div className="flex items-start justify-between"><h3 className="font-medium">{i.name}</h3><StatusBadge status="planejado" /></div>
            <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">Desconectado · {i.phase}</p>
          </Panel>
        ))}
      </div>
      <h2 className="label-mono">Automações</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {automations.map((a) => (
          <Panel key={a.name}>
            <div className="flex items-start justify-between"><h3 className="font-medium">{a.name}</h3><StatusBadge status="planejado" /></div>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
