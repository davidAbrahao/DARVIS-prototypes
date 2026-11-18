"use client";

import { useState } from "react";
import {
  ArrowUp,
  Bell,
  Bot,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Library,
  Link2,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

type View = "Central" | "Assistente" | "Memórias" | "Projetos" | "Tarefas" | "Conhecimento" | "Automações" | "Integrações" | "Configurações";

const navItems: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Central", icon: LayoutDashboard },
  { label: "Assistente", icon: Bot },
  { label: "Memórias", icon: Library },
  { label: "Projetos", icon: FolderKanban },
  { label: "Tarefas", icon: CircleCheck },
  { label: "Conhecimento", icon: Network },
  { label: "Automações", icon: Zap },
  { label: "Integrações", icon: Link2 },
];

const tasks = [
  { title: "Revisar arquitetura do D.A.R.V.I.S.", project: "Produto", time: "09:30", done: false },
  { title: "Organizar notas da sprint", project: "Memória", time: "11:00", done: true },
  { title: "Definir primeiro fluxo de automação", project: "Produto", time: "14:30", done: false },
];

const projects = [
  { name: "D.A.R.V.I.S.", detail: "Protótipo visual", progress: 72, color: "#63a4ff" },
  { name: "Vault pessoal", detail: "Organização", progress: 48, color: "#9ba7bd" },
  { name: "Estudos de IA", detail: "Pesquisa ativa", progress: 31, color: "#58c7c2" },
];

function StatusDot({ color = "#60d394" }: { color?: string }) {
  return <span className="status-dot" style={{ background: color }} />;
}

export default function Home() {
  const [view, setView] = useState<View>("Central");
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const selectView = (next: View) => {
    setView(next);
    setMenuOpen(false);
  };

  return (
    <main className="shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark"><span>D</span></div>
          <div>
            <strong>D.A.R.V.I.S.</strong>
            <small>SISTEMA PESSOAL</small>
          </div>
          <button className="icon-button close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className={view === item.label ? "nav-item active" : "nav-item"} onClick={() => selectView(item.label)}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className={view === "Configurações" ? "nav-item active" : "nav-item"} onClick={() => selectView("Configurações")}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Configurações</span>
          </button>
          <div className="profile">
            <div className="avatar">DA</div>
            <div>
              <strong>David Abrahão</strong>
              <small><StatusDot /> Sistema online</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Fechar navegação" onClick={() => setMenuOpen(false)} />}

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{view}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Buscar"><Search size={18} /></button>
            <button className="icon-button notification" aria-label="Notificações"><Bell size={18} /><span /></button>
          </div>
        </header>

        {view === "Central" ? (
          <div className="content dashboard">
            <div className="welcome">
              <div>
                <p className="eyebrow">CENTRAL DE COMANDO</p>
                <h1>Bom dia, David.</h1>
                <p>Sua inteligência pessoal está pronta.</p>
              </div>
              <div className="system-state"><StatusDot /><span>Todos os sistemas operacionais</span></div>
            </div>

            <div className="command-card">
              <div className="orb"><Sparkles size={19} /></div>
              <div className="command-input">
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="O que você precisa fazer?" aria-label="Mensagem para o D.A.R.V.I.S." />
              </div>
              <button className="send-button" aria-label="Enviar mensagem" onClick={() => setMessage("")}><ArrowUp size={18} /></button>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-icon blue"><CircleCheck size={19} /></div>
                <div><small>TAREFAS HOJE</small><strong>5 <span>/ 8 concluídas</span></strong></div>
                <div className="mini-progress"><span style={{ width: "62%" }} /></div>
              </article>
              <article className="stat-card">
                <div className="stat-icon cyan"><CalendarDays size={19} /></div>
                <div><small>PRÓXIMO COMPROMISSO</small><strong>14:30 <span>Review semanal</span></strong></div>
              </article>
              <article className="stat-card">
                <div className="stat-icon violet"><Library size={19} /></div>
                <div><small>MEMÓRIA ATIVA</small><strong>248 <span>registros</span></strong></div>
              </article>
            </div>

            <div className="dashboard-grid">
              <article className="panel tasks-panel">
                <div className="panel-header">
                  <div><p className="panel-kicker">AGENDA</p><h2>Tarefas prioritárias</h2></div>
                  <button className="text-button" onClick={() => selectView("Tarefas")}>Ver tudo <ChevronRight size={15} /></button>
                </div>
                <div className="task-list">
                  {tasks.map((task) => (
                    <div className="task-row" key={task.title}>
                      <button className={task.done ? "task-check checked" : "task-check"} aria-label={task.done ? "Concluir tarefa" : "Marcar tarefa como concluída"}>
                        {task.done && <CircleCheck size={15} />}
                      </button>
                      <div className="task-info"><strong className={task.done ? "completed" : ""}>{task.title}</strong><span>{task.project}</span></div>
                      <div className="task-time"><Clock3 size={13} /> {task.time}</div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel projects-panel">
                <div className="panel-header">
                  <div><p className="panel-kicker">PORTFÓLIO</p><h2>Projetos ativos</h2></div>
                  <button className="icon-button small" onClick={() => selectView("Projetos")} aria-label="Adicionar projeto"><Plus size={17} /></button>
                </div>
                <div className="project-list">
                  {projects.map((project) => (
                    <button className="project-row" key={project.name} onClick={() => selectView("Projetos")}>
                      <span className="project-icon" style={{ color: project.color }}><FolderKanban size={17} /></span>
                      <div className="project-info"><strong>{project.name}</strong><span>{project.detail}</span></div>
                      <div className="project-progress"><span>{project.progress}%</span><div><i style={{ width: `${project.progress}%`, background: project.color }} /></div></div>
                    </button>
                  ))}
                </div>
              </article>
            </div>

            <div className="lower-grid">
              <article className="panel activity-panel">
                <div className="panel-header"><div><p className="panel-kicker">HISTÓRICO</p><h2>Atividade recente</h2></div></div>
                <div className="activity-list">
                  <div><span className="activity-icon"><MessageSquareText size={15} /></span><p><strong>Nova memória registrada</strong><small>Preferência de arquitetura · há 12 min</small></p></div>
                  <div><span className="activity-icon green"><CircleCheck size={15} /></span><p><strong>Tarefa concluída</strong><small>Organizar notas da sprint · há 38 min</small></p></div>
                  <div><span className="activity-icon violet"><FolderKanban size={15} /></span><p><strong>Projeto atualizado</strong><small>D.A.R.V.I.S. · há 1 hora</small></p></div>
                </div>
              </article>

              <article className="panel integrations-panel">
                <div className="panel-header">
                  <div><p className="panel-kicker">CONEXÕES</p><h2>Integrações</h2></div>
                  <button className="text-button" onClick={() => selectView("Integrações")}>Gerenciar</button>
                </div>
                <div className="integration-grid">
                  <button><span className="integration-logo telegram">T</span><div><strong>Telegram</strong><small>Não conectado</small></div></button>
                  <button><span className="integration-logo google">G</span><div><strong>Google</strong><small>Não conectado</small></div></button>
                  <button><span className="integration-logo github">GH</span><div><strong>GitHub</strong><small>Não conectado</small></div></button>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <SectionView view={view} onBack={() => selectView("Central")} />
        )}
      </section>
    </main>
  );
}

function SectionView({ view, onBack }: { view: View; onBack: () => void }) {
  const descriptions: Partial<Record<View, string>> = {
    Assistente: "Converse com o D.A.R.V.I.S. e utilize ferramentas autorizadas.",
    Memórias: "Consulte, organize e relacione registros da memória pessoal.",
    Projetos: "Acompanhe objetivos, etapas e histórico de evolução.",
    Tarefas: "Organize a agenda pessoal e suas prioridades.",
    Conhecimento: "Acesse documentos, estudos e referências.",
    Automações: "Gerencie fluxos e agentes de execução.",
    Integrações: "Conecte Telegram, Google, GitHub e outros serviços.",
    Configurações: "Configure identidade, segurança e preferências.",
  };

  return (
    <div className="content section-view">
      <div className="section-heading">
        <div><p className="eyebrow">MÓDULO</p><h1>{view}</h1><p>{descriptions[view]}</p></div>
        <span className="prototype-badge">PROTÓTIPO</span>
      </div>
      <div className="empty-module">
        <div className="empty-icon"><Sparkles size={28} /></div>
        <h2>Interface em construção</h2>
        <p>Este módulo está identificado para a próxima fase de desenvolvimento. Nenhuma integração real está ativa.</p>
        <button onClick={onBack}>Voltar à Central</button>
      </div>
    </div>
  );
}
