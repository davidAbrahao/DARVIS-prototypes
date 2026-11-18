import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusBadge } from "@/components/darvis/ui";
import type { Status } from "@/lib/darvis-data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — D.A.R.V.I.S." },
      { name: "description", content: "Usuário, provedores de IA, segurança, memória e notificações." },
      { property: "og:title", content: "Configurações — D.A.R.V.I.S." },
      { property: "og:description", content: "Usuário, provedores de IA, segurança, memória e notificações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

const sections: { title: string; items: [string, string, Status][] }[] = [
  { title: "Usuário", items: [["Nome", "David Abrahão Rodrigues", "simulado"], ["Idioma", "Português (Brasil)", "simulado"], ["Autenticação", "Fase 2", "planejado"]] },
  { title: "Provedores de IA", items: [["Provedor principal", "Google Gemini", "planejado"], ["Camada multi-provedor", "Fase 4", "planejado"]] },
  { title: "Segurança", items: [["Aprovação humana para ações sensíveis", "Ativada por padrão", "planejado"], ["Logs de auditoria", "Fase 2", "planejado"]] },
  { title: "Memória", items: [["Armazenamento", "PostgreSQL + Vault Markdown", "planejado"], ["Busca semântica", "Fase posterior", "planejado"]] },
  { title: "Interface", items: [["Navegação e layout responsivo", "Disponível", "implementado"], ["Instalação como app (PWA)", "Fase 7", "planejado"]] },
];

function Settings() {
  return (
    <div>
      <PageHeader eyebrow="System Settings" title="Configurações" />
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <Panel key={s.title} title={s.title}>
            <ul className="divide-y">
              {s.items.map(([k, v, st]) => (
                <li key={k} className="flex items-center justify-between gap-3 py-2.5">
                  <div><p className="text-sm">{k}</p><p className="text-xs text-muted-foreground">{v}</p></div>
                  <StatusBadge status={st} />
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
