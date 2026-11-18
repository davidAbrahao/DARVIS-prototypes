import { Activity, BrainCircuit, Command, FolderKanban, Layers3, Network, ShieldCheck, Workflow, type LucideIcon } from "lucide-react";
import { AssistantWorkspace } from "./assistant-workspace";
import { DashboardOverview } from "./dashboard-overview";
import { ProtectedPage } from "./protected-page";
import { SessionActions } from "./session-actions";

const navigation: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  href?: string;
}[] = [
  { label: "Central de Comando", icon: Command, active: true, href: "#overview" },
  { label: "Assistente de IA", icon: BrainCircuit, href: "#assistant" },
  { label: "Central de Memória", icon: Network },
  { label: "Projetos e Tarefas", icon: FolderKanban, href: "#projects" },
  { label: "Conhecimento", icon: Layers3 },
  { label: "Integrações", icon: Workflow },
];



export default function Home() {
  return (
    <ProtectedPage>
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="D.A.R.V.I.S. início">
          <span className="brand-mark"><Activity size={21} /></span>
          <span><strong>D.A.R.V.I.S.</strong><small>SISTEMA COGNITIVO</small></span>
        </a>
        <div className="nav-label">ÁREA DE TRABALHO</div>
        <nav className="navigation" aria-label="Navegação principal">
          {navigation.map(({ label, icon: Icon, active, href }) => (
            href ? (
              <a className={`nav-item ${active ? "active" : ""}`} href={href} key={label}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              </a>
            ) : (
              <div className="nav-item nav-disabled" aria-disabled="true" key={label}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              </div>
            )
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-chip"><ShieldCheck size={16} /><span>Segurança em primeiro lugar</span></div>
          <div className="profile"><div className="avatar">DA</div><div><strong>Espaço pessoal</strong><small>Ambiente inicial</small></div></div>
        </div>
      </aside>

      <section className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb">D.A.R.V.I.S. <span>/</span> <strong>Central de Comando</strong></div>
          <div className="topbar-right"><span className="environment"><i /> FUNDAÇÃO · RASCUNHO</span><SessionActions /></div>
        </header>

        <div className="content">
          <section className="welcome">
            <div><div className="eyebrow"><span className="eyebrow-line" /> SISTEMA DE INTELIGÊNCIA PESSOAL</div><h1>Bom dia.<br /><span>Vamos colocar as ideias em movimento.</span></h1><p>Seu espaço de inteligência pessoal está tomando forma.</p></div>
            <div className="orb" aria-hidden="true"><div className="orb-core"><BrainCircuit size={35} /></div></div>
          </section>

          <section className="status-panel" aria-label="Estado do ambiente">
            <div className="status-copy"><span className="status-dot" /><div><strong>Ambiente de fundação</strong><small>Autenticação e domínio implementados · validação operacional pendente</small></div></div>
            <span className="status-tag">EM CONSTRUÇÃO</span>
          </section>

          <DashboardOverview />

          <section className="bottom-grid">
            <AssistantWorkspace />
            <article className="panel system-panel"><div className="panel-heading"><div><span className="eyebrow">VISÃO GERAL DO SISTEMA</span><h2>Camadas do sistema</h2></div></div><div className="layer-list"><div><span className="layer-icon"><Command size={15} /></span><span><strong>Interface</strong><small>Next.js · Cognitive Cockpit</small></span><em className="layer-ready">BASE CRIADA</em></div><div><span className="layer-icon"><Network size={15} /></span><span><strong>API</strong><small>FastAPI · endpoints de domínio criados</small></span><em>IMPLEMENTADA</em></div><div><span className="layer-icon"><Layers3 size={15} /></span><span><strong>Dados e conversas</strong><small>PostgreSQL · migrações 0001–0006 pendentes</small></span><em>VALIDAÇÃO PENDENTE</em></div></div></article>
          </section>
          <footer> D.A.R.V.I.S. <span>·</span> Construído com intenção, transparência e controle.</footer>
        </div>
      </section>
    </main>
    </ProtectedPage>
  );
}
