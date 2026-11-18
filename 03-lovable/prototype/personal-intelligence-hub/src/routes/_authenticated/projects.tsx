import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Progress } from "@/components/darvis/ui";
import { projects } from "@/lib/darvis-data";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projetos — D.A.R.V.I.S." },
      { name: "description", content: "Projetos, objetivos, etapas e pendências." },
      { property: "og:title", content: "Projetos — D.A.R.V.I.S." },
      { property: "og:description", content: "Projetos, objetivos, etapas e pendências." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Projects,
});

function Projects() {
  return (
    <div>
      <PageHeader eyebrow="Projects" title="Projetos" desc="Dados de exemplo." status="simulado" />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <Panel key={p.id}>
            <h3 className="text-lg font-medium">{p.name}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{p.desc}</p>
            <Progress value={p.progress} />
            <div className="mt-3 flex justify-between font-mono text-xs text-muted-foreground"><span>{p.phase}</span><span>{p.open} pendências · {p.progress}%</span></div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
