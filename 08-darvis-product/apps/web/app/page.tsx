import { Activity, BrainCircuit, CalendarDays, Command, FolderKanban, Layers3, Mic2, Network, ShieldCheck, Sparkles, Workflow } from "lucide-react";

const navigation = [
  { label: "Command Center", icon: Command, active: true },
  { label: "AI Assistant", icon: BrainCircuit },
  { label: "Memory Center", icon: Network },
  { label: "Projects & Tasks", icon: FolderKanban },
  { label: "Knowledge", icon: Layers3 },
  { label: "Integrations", icon: Workflow },
];

const modules = [
  { title: "Assistente", description: "Conversa contextual e ações aprovadas", icon: Sparkles },
  { title: "Memória", description: "Conhecimento pessoal sob seu controle", icon: BrainCircuit },
  { title: "Projetos", description: "Objetivos, tarefas e acompanhamento", icon: FolderKanban },
  { title: "Agenda", description: "Compromissos e planejamento", icon: CalendarDays },
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="D.A.R.V.I.S. início">
          <span className="brand-mark"><Activity size={21} /></span>
          <span><strong>D.A.R.V.I.S.</strong><small>COGNITIVE SYSTEM</small></span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Navegação principal">
          {navigation.map(({ label, icon: Icon, active }) => (
            <a className={`nav-item${active ? " active" : ""}`} href="#overview" key={label}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-chip"><ShieldCheck size={16} /><span>Segurança em primeiro lugar</span></div>
          <div className="profile"><div className="avatar">DA</div><div><strong>Workspace pessoal</strong><small>Ambiente inicial</small></div></div>
        </div>
      </aside>

      <section className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb">D.A.R.V.I.S. <span>/</span> <strong>Command Center</strong></div>
          <div className="topbar-right"><span className="environment"><i /> FOUNDATION BUILD</span><button className="icon-button" aria-label="Atividade"><Activity size={18} /></button></div>
        </header>

        <div className="content">
          <section className="welcome">
            <div><div className="eyebrow"><span className="eyebrow-line" /> PERSONAL INTELLIGENCE SYSTEM</div><h1>Bom dia.<br /><span>Vamos colocar as ideias em movimento.</span></h1><p>Seu espaço de inteligência pessoal está tomando forma.</p></div>
            <div className="orb" aria-hidden="true"><div className="orb-core"><BrainCircuit size={35} /></div></div>
          </section>

          <section className="status-panel" aria-label="Estado do ambiente">
            <div className="status-copy"><span className="status-dot" /><div><strong>Ambiente de fundação</strong><small>Interface inicial criada · integrações ainda não conectadas</small></div></div>
            <span className="status-tag">EM CONSTRUÇÃO</span>
          </section>

          <section className="section-heading"><div><span className="eyebrow">YOUR COGNITIVE SPACE</span><h2>Seu centro de comando</h2></div><span className="section-note">Módulos planejados</span></section>
          <section className="module-grid">
            {modules.map(({ title, description, icon: Icon }, index) => (
              <article className="module-card" key={title}><div className="module-top"><span className="module-icon"><Icon size={19} /></span><span className="module-index">0{index + 1}</span></div><h3>{title}</h3><p>{description}</p><span className="module-state">A IMPLEMENTAR</span></article>
            ))}
          </section>

          <section className="bottom-grid">
            <article className="panel assistant-panel"><div className="panel-heading"><div><span className="eyebrow">INTERFACE PREVIEW</span><h2>AI Assistant</h2></div><span className="coming-soon">PRÓXIMA FASE</span></div><div className="assistant-placeholder"><span className="assistant-symbol"><Mic2 size={22} /></span><div><strong>Uma inteligência que trabalha com você.</strong><p>Conversa, memória e ferramentas serão conectadas ao backend nas próximas entregas.</p></div></div><div className="input-preview"><span>O que vamos construir hoje?</span><Sparkles size={17} /></div></article>
            <article className="panel system-panel"><div className="panel-heading"><div><span className="eyebrow">SYSTEM OVERVIEW</span><h2>Camadas do sistema</h2></div></div><div className="layer-list"><div><span className="layer-icon"><Command size={15} /></span><span><strong>Interface</strong><small>Next.js · Cognitive Cockpit</small></span><em className="layer-ready">BASE CRIADA</em></div><div><span className="layer-icon"><Network size={15} /></span><span><strong>API</strong><small>FastAPI · conexão pendente</small></span><em>EM PROGRESSO</em></div><div><span className="layer-icon"><Layers3 size={15} /></span><span><strong>Dados e memória</strong><small>PostgreSQL · não conectado</small></span><em>PLANEJADO</em></div></div></article>
          </section>
          <footer> D.A.R.V.I.S. <span>·</span> Construído com intenção, transparência e controle.</footer>
        </div>
      </section>
    </main>
  );
}
