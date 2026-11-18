"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type PageKey = "dashboard" | "assistant" | "memory" | "projects" | "tasks" | "knowledge" | "automations" | "integrations" | "settings";
type Task = { id: number; title: string; detail: string; due: string; priority: "Alta" | "Média" | "Baixa"; done: boolean };
type Memory = { id: number; title: string; body: string; category: string; date: string };
type Project = { id: number; name: string; description: string; progress: number; status: string; color: string };
type ChatMessage = { id: number; role: "user" | "assistant"; text: string; time: string };

const navGroups: { label: string; items: { key: PageKey; label: string; icon: string }[] }[] = [
  { label: "WORKSPACE", items: [
    { key: "dashboard", label: "Command Center", icon: "⌂" },
    { key: "assistant", label: "AI Assistant", icon: "✳" },
    { key: "memory", label: "Memory Center", icon: "◈" },
  ] },
  { label: "ORGANIZAÇÃO", items: [
    { key: "projects", label: "Projetos", icon: "▦" },
    { key: "tasks", label: "Tarefas", icon: "☷" },
    { key: "knowledge", label: "Base de conhecimento", icon: "▤" },
  ] },
  { label: "SISTEMA", items: [
    { key: "automations", label: "Automações", icon: "⌘" },
    { key: "integrations", label: "Integrações", icon: "⛓" },
    { key: "settings", label: "Configurações", icon: "⚙" },
  ] },
];

const initialTasks: Task[] = [
  { id: 1, title: "Definir estrutura inicial do D.A.R.V.I.S.", detail: "Arquitetura e organização do repositório", due: "Hoje", priority: "Alta", done: false },
  { id: 2, title: "Documentar entidades da memória", detail: "Tipos, categorias e relacionamentos", due: "Amanhã", priority: "Média", done: false },
  { id: 3, title: "Mapear integrações prioritárias", detail: "Gemini, Telegram e Obsidian", due: "20 nov", priority: "Média", done: true },
];

const initialMemories: Memory[] = [
  { id: 1, title: "Princípios do D.A.R.V.I.S.", body: "Memória persistente separada do modelo de IA, arquitetura modular e ações sempre sujeitas a permissões.", category: "Projeto", date: "17 nov 2026" },
  { id: 2, title: "Direção visual", body: "Interface dark, minimalista e tecnológica. Priorizar legibilidade e evitar excesso de efeitos visuais.", category: "Preferência", date: "17 nov 2026" },
  { id: 3, title: "Stack planejada", body: "Next.js, TypeScript, FastAPI, PostgreSQL/Supabase e Gemini como primeiro provedor de IA.", category: "Técnica", date: "17 nov 2026" },
];

const initialProjects: Project[] = [
  { id: 1, name: "D.A.R.V.I.S.", description: "Ecossistema de inteligência pessoal e central de comando.", progress: 18, status: "Em desenvolvimento", color: "cyan" },
  { id: 2, name: "Segundo Cérebro", description: "Captura, classificação e recuperação de conhecimento pessoal.", progress: 42, status: "Estruturação", color: "violet" },
  { id: 3, name: "Integração Obsidian", description: "Sincronização de notas Markdown e memória de longo prazo.", progress: 8, status: "Planejamento", color: "blue" },
];

const initialMessages: ChatMessage[] = [
  { id: 1, role: "assistant", text: "Olá! Sou o D.A.R.V.I.S. Este é o protótipo da sua central de inteligência pessoal. Nesta fase, consigo demonstrar a experiência e organizar dados temporários nesta interface. A conexão com um modelo Gemini ainda não foi ativada.", time: "Agora" },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Command Center", subtitle: "Visão geral do seu ecossistema de inteligência pessoal." },
  assistant: { title: "AI Assistant", subtitle: "Um ponto de entrada para ideias, perguntas e ações." },
  memory: { title: "Memory Center", subtitle: "Informações organizadas para dar contexto ao seu assistente." },
  projects: { title: "Projetos", subtitle: "Acompanhe iniciativas, etapas e evolução." },
  tasks: { title: "Tarefas", subtitle: "Transforme intenções em próximas ações." },
  knowledge: { title: "Base de conhecimento", subtitle: "Documentos, referências e conteúdos de consulta." },
  automations: { title: "Automation Center", subtitle: "Rotinas e agentes sob controle explícito." },
  integrations: { title: "Integrações", subtitle: "Conexões disponíveis e futuras integrações." },
  settings: { title: "Configurações", subtitle: "Preferências, segurança e comportamento do sistema." },
};

function BrandMark() {
  return <div className="brand-mark"><span>D</span><i /></div>;
}

function StatusDot({ color = "green" }: { color?: "green" | "amber" | "muted" }) {
  return <span className={`status-dot ${color}`} />;
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><h3>{title}</h3>{action && <button className="text-button" onClick={onAction}>{action}<span> ↗</span></button>}</div>;
}

export default function Home() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [memoryInput, setMemoryInput] = useState("");
  const [memoryCategory, setMemoryCategory] = useState("Pessoal");
  const [taskInput, setTaskInput] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [search, setSearch] = useState("");
  const [automationEnabled, setAutomationEnabled] = useState([false, false, false]);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [toast, setToast] = useState("");

  const completedTasks = tasks.filter((task) => task.done).length;
  const openTasks = tasks.length - completedTasks;
  const filteredMemories = useMemo(() => memories.filter((item) => `${item.title} ${item.body} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [memories, search]);
  const filteredProjects = useMemo(() => projects.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())), [projects, search]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const userMessage: ChatMessage = { id: Date.now(), role: "user", text, time: now };
    const response: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: "Recebi sua mensagem. No protótipo, a conversa é local e esta resposta é demonstrativa. Na próxima etapa, conectaremos o backend FastAPI ao Gemini, com contexto de sessão, recuperação de memória e ferramentas autorizadas.",
      time: now,
    };
    setMessages((current) => [...current, userMessage, response]);
    setChatInput("");
  }

  function addMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = memoryInput.trim();
    if (!title) return;
    setMemories((current) => [{ id: Date.now(), title, body: "Registro adicionado manualmente nesta sessão de demonstração.", category: memoryCategory, date: "Agora" }, ...current]);
    setMemoryInput("");
    notify("Memória adicionada à sessão de demonstração.");
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskInput.trim();
    if (!title) return;
    setTasks((current) => [{ id: Date.now(), title, detail: "Nova tarefa criada no protótipo", due: "Sem prazo", priority: "Média", done: false }, ...current]);
    setTaskInput("");
    notify("Tarefa adicionada à sessão.");
  }

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectInput.trim();
    if (!name) return;
    setProjects((current) => [{ id: Date.now(), name, description: "Projeto criado no protótipo. Adicione objetivos e etapas na versão integrada.", progress: 0, status: "Novo", color: "blue" }, ...current]);
    setProjectInput("");
    notify("Projeto adicionado à sessão.");
  }

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function goTo(next: PageKey) {
    setPage(next);
    setSearch("");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><BrandMark /><div><strong>D.A.R.V.I.S.</strong><span>PERSONAL INTELLIGENCE</span></div></div>
        <div className="workspace-switch"><div className="workspace-avatar">DA</div><div><strong>Meu workspace</strong><span>Ambiente pessoal</span></div><span className="chevron">⌄</span></div>
        <nav className="side-nav">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => <button key={item.key} onClick={() => goTo(item.key)} className={`nav-item ${page === item.key ? "active" : ""}`}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.key === "assistant" && <span className="nav-pulse" />}</button>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-card"><div className="system-card-top"><span className="pulse-ring" /><span>PROTÓTIPO LOCAL</span></div><strong>Sistema em demonstração</strong><p>Dados temporários. Nenhuma integração externa ativa.</p><div className="system-card-line"><span>Interface</span><b><StatusDot /> Operacional</b></div><div className="system-card-line"><span>Backend / IA</span><b><StatusDot color="amber" /> Pendente</b></div></div>
          <div className="profile-row"><div className="profile-avatar">DA</div><div className="profile-copy"><strong>David Abrahão</strong><span>Administrador</span></div><button className="icon-button" aria-label="Abrir configurações" onClick={() => goTo("settings")}>···</button></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{pageTitles[page].title}</strong></div>
          <div className="topbar-actions"><div className="environment-pill"><StatusDot color="amber" /> DEMO</div><label className="global-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nesta seção..." /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Notificações" onClick={() => notify("Você está em um ambiente de demonstração.")}>♧<i /></button><div className="top-avatar">DA</div></div>
        </header>

        <div className="page-content">
          <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> PERSONAL INTELLIGENCE SYSTEM</div><h1>{pageTitles[page].title}</h1><p>{pageTitles[page].subtitle}</p></div>{page === "dashboard" && <div className="date-chip"><span>◷</span> {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>}</div>
          {page === "dashboard" && <Dashboard tasks={tasks} projects={projects} memoryCount={memories.length} completedTasks={completedTasks} openTasks={openTasks} showAllTasks={showAllTasks} setShowAllTasks={setShowAllTasks} toggleTask={toggleTask} goTo={goTo} setChatInput={setChatInput} />}
          {page === "assistant" && <Assistant messages={messages} chatInput={chatInput} setChatInput={setChatInput} sendMessage={sendMessage} />}
          {page === "memory" && <MemoryCenter memories={filteredMemories} memoryInput={memoryInput} setMemoryInput={setMemoryInput} memoryCategory={memoryCategory} setMemoryCategory={setMemoryCategory} addMemory={addMemory} />}
          {page === "projects" && <Projects projects={filteredProjects} projectInput={projectInput} setProjectInput={setProjectInput} addProject={addProject} />}
          {page === "tasks" && <Tasks tasks={tasks} taskInput={taskInput} setTaskInput={setTaskInput} addTask={addTask} toggleTask={toggleTask} />}
          {page === "knowledge" && <Knowledge search={search} />}
          {page === "automations" && <Automations enabled={automationEnabled} setEnabled={setAutomationEnabled} notify={notify} />}
          {page === "integrations" && <Integrations notify={notify} />}
          {page === "settings" && <Settings notify={notify} />}
          <footer className="page-footer"><span><BrandMark /> D.A.R.V.I.S. <b>0.1.0-prototype</b></span><span>Experiência demonstrativa · Dados não persistentes</span></footer>
        </div>
      </section>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function Dashboard({ tasks, projects, memoryCount, completedTasks, openTasks, showAllTasks, setShowAllTasks, toggleTask, goTo, setChatInput }: {
  tasks: Task[]; projects: Project[]; memoryCount: number; completedTasks: number; openTasks: number; showAllTasks: boolean; setShowAllTasks: (value: boolean) => void; toggleTask: (id: number) => void; goTo: (page: PageKey) => void; setChatInput: (value: string) => void;
}) {
  const visibleTasks = (showAllTasks ? tasks : tasks.slice(0, 3));
  return <>
    <section className="hero-panel">
      <div className="hero-grid" />
      <div className="hero-copy"><div className="hero-status"><span className="live-dot" /> SISTEMA PRONTO PARA INTERAÇÃO</div><h2>Olá, David<span>.</span></h2><p>Seu espaço de inteligência está organizado. O que vamos construir hoje?</p>
        <button className="hero-input" onClick={() => goTo("assistant")}><span className="sparkle">✳</span><span>Converse com o D.A.R.V.I.S. ou peça uma ação...</span><kbd>↵</kbd></button>
        <div className="quick-prompts"><button onClick={() => { setChatInput("Faça um resumo dos meus projetos ativos."); goTo("assistant"); }}>◈ Resumir meus projetos</button><button onClick={() => { setChatInput("Quais são minhas próximas tarefas?"); goTo("assistant"); }}>☷ Próximas tarefas</button><button onClick={() => goTo("memory")}>＋ Registrar uma memória</button></div>
      </div>
      <div className="hero-orb"><div className="orb-core"><BrandMark /></div><div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb-cross cross-one" /><div className="orb-cross cross-two" /><span className="orb-caption">D.A.R.V.I.S. CORE</span></div>
    </section>

    <div className="metrics-grid">
      <MetricCard label="TAREFAS EM ABERTO" value={String(openTasks).padStart(2, "0")} foot={`${completedTasks} concluídas`} icon="☷" tone="cyan" />
      <MetricCard label="PROJETOS ATIVOS" value={String(projects.length).padStart(2, "0")} foot="Em acompanhamento" icon="▦" tone="violet" />
      <MetricCard label="MEMÓRIAS" value={String(memoryCount).padStart(2, "0")} foot="Registros demonstrativos" icon="◈" tone="blue" />
      <MetricCard label="INTEGRAÇÕES" value="00" foot="Aguardando configuração" icon="⛓" tone="amber" />
    </div>

    <div className="dashboard-columns">
      <section className="panel task-panel"><SectionHeading title="Minhas tarefas" action="Ver todas" onAction={() => goTo("tasks")} /><div className="task-progress"><div><span>Progresso geral</span><strong>{tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0}%</strong></div><div className="progress-track"><span style={{ width: `${tasks.length ? completedTasks / tasks.length * 100 : 0}%` }} /></div></div><div className="task-list">{visibleTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}</div>{tasks.length === 0 && <EmptyState text="Nenhuma tarefa por aqui. Adicione sua primeira tarefa." />}{tasks.length > 3 && <button className="inline-more" onClick={() => setShowAllTasks(!showAllTasks)}>{showAllTasks ? "Mostrar menos" : "Mostrar todas"}</button>}</section>
      <section className="panel projects-panel"><SectionHeading title="Projetos em foco" action="Ver projetos" onAction={() => goTo("projects")} /><div className="project-list">{projects.slice(0, 3).map((project) => <ProjectRow key={project.id} project={project} />)}</div>{projects.length === 0 && <EmptyState text="Seus projetos aparecerão aqui." />}<button className="add-project-inline" onClick={() => goTo("projects")}>＋ Abrir gerenciador de projetos</button></section>
    </div>

    <div className="bottom-grid"><section className="panel activity-panel"><SectionHeading title="Atividade recente" action="Ver memória" onAction={() => goTo("memory")} /><div className="activity-list"><ActivityItem icon="◈" title="Memória do sistema criada" detail="Princípios do D.A.R.V.I.S." time="Há pouco" /><ActivityItem icon="▦" title="Projeto adicionado ao workspace" detail="D.A.R.V.I.S." time="Hoje, 09:40" /><ActivityItem icon="⚙" title="Ambiente de demonstração iniciado" detail="Interface local v0.1.0" time="Hoje, 09:30" /></div></section><section className="panel integrations-mini"><SectionHeading title="Estado do sistema" action="Detalhes" onAction={() => goTo("integrations")} /><div className="integration-state"><div className="state-icon ai">✳</div><div><strong>Provedor de IA</strong><span>Gemini · aguardando chave</span></div><StatusDot color="amber" /></div><div className="integration-state"><div className="state-icon db">◫</div><div><strong>Banco de dados</strong><span>Supabase · não configurado</span></div><StatusDot color="muted" /></div><div className="integration-state"><div className="state-icon tg">➤</div><div><strong>Telegram</strong><span>Bot · não conectado</span></div><StatusDot color="muted" /></div></section></div>
  </>;
}

function MetricCard({ label, value, foot, icon, tone }: { label: string; value: string; foot: string; icon: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div><div className={`metric-decoration ${tone}`} /></div>;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return <div className={`task-row ${task.done ? "is-done" : ""}`}><button className={`task-check ${task.done ? "checked" : ""}`} onClick={onToggle} aria-label={task.done ? "Reabrir tarefa" : "Concluir tarefa"}>{task.done ? "✓" : ""}</button><div className="task-main"><strong>{task.title}</strong><span>{task.detail}</span></div><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span className="task-due">{task.due}</span></div>;
}

function ProjectRow({ project }: { project: Project }) {
  return <div className="project-row"><div className={`project-symbol ${project.color}`}>{project.name.slice(0, 1).toUpperCase()}</div><div className="project-main"><div className="project-title"><strong>{project.name}</strong><span>{project.progress}%</span></div><p>{project.description}</p><div className="progress-track small"><span style={{ width: `${project.progress}%` }} /></div><div className="project-status">{project.status}</div></div></div>;
}

function ActivityItem({ icon, title, detail, time }: { icon: string; title: string; detail: string; time: string }) {
  return <div className="activity-item"><div className="activity-icon">{icon}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>;
}

function Assistant({ messages, chatInput, setChatInput, sendMessage }: { messages: ChatMessage[]; chatInput: string; setChatInput: (value: string) => void; sendMessage: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="assistant-layout"><section className="chat-panel panel"><div className="chat-header"><div className="assistant-avatar"><BrandMark /></div><div><strong>D.A.R.V.I.S. Core</strong><span><StatusDot /> Interface ativa · IA não conectada</span></div><div className="chat-mode">MODO DEMONSTRAÇÃO</div></div><div className="chat-messages">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}><div className="message-avatar">{message.role === "assistant" ? <BrandMark /> : "DA"}</div><div className="message-content"><div className="message-meta"><strong>{message.role === "assistant" ? "D.A.R.V.I.S." : "Você"}</strong><time>{message.time}</time></div><p>{message.text}</p></div></div>)}</div><form className="chat-composer" onSubmit={sendMessage}><button type="button" className="composer-plus" title="Anexos ainda não disponíveis">＋</button><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Escreva uma mensagem para o D.A.R.V.I.S..." /><button className="send-button" type="submit" disabled={!chatInput.trim()} aria-label="Enviar mensagem">↑</button></form><div className="composer-note">Enter para enviar · As respostas são demonstrativas nesta versão.</div></section><aside className="assistant-aside"><div className="panel context-panel"><div className="aside-eyebrow">CONTEXTO DA SESSÃO</div><h3>Memória em construção.</h3><p>O assistente conectado poderá consultar memórias autorizadas para responder com contexto.</p><div className="context-stat"><span>Memórias disponíveis</span><strong>03</strong></div><div className="context-stat"><span>Ferramentas habilitadas</span><strong>00</strong></div><div className="context-stat"><span>Provedor conectado</span><strong className="muted-value">Não</strong></div></div><div className="panel suggestion-panel"><div className="aside-eyebrow">EXPERIMENTE</div><button onClick={() => setChatInput("Me ajude a estruturar as próximas fases do D.A.R.V.I.S.")}>✳ <span>Planejar as próximas fases</span> ↗</button><button onClick={() => setChatInput("Quero registrar uma nova ideia na minha memória.")}>◈ <span>Registrar uma ideia</span> ↗</button><button onClick={() => setChatInput("Quais informações o sistema mantém nesta demonstração?")}>⌕ <span>Explorar a memória</span> ↗</button></div></aside></div>;
}

function MemoryCenter({ memories, memoryInput, setMemoryInput, memoryCategory, setMemoryCategory, addMemory }: { memories: Memory[]; memoryInput: string; setMemoryInput: (value: string) => void; memoryCategory: string; setMemoryCategory: (value: string) => void; addMemory: (event: FormEvent<HTMLFormElement>) => void }) {
  return <><div className="memory-overview"><div className="memory-summary panel"><div className="summary-icon">◈</div><div><span>REGISTROS VISÍVEIS</span><strong>{String(memories.length).padStart(2, "0")}</strong><small>Na sessão atual do protótipo</small></div></div><div className="memory-summary panel"><div className="summary-icon violet-icon">⌁</div><div><span>MEMÓRIA PERSISTENTE</span><strong className="summary-word">Não ativa</strong><small>Será implementada com PostgreSQL/Obsidian</small></div></div><div className="memory-summary panel"><div className="summary-icon blue-icon">⌕</div><div><span>BUSCA SEMÂNTICA</span><strong className="summary-word">Planejada</strong><small>Recuperação contextual em fase futura</small></div></div></div><div className="panel add-memory-panel"><div><h3>Adicionar memória</h3><p>Registre uma informação de exemplo. Ela ficará disponível apenas enquanto esta página estiver aberta.</p></div><form onSubmit={addMemory} className="inline-form"><input value={memoryInput} onChange={(e) => setMemoryInput(e.target.value)} placeholder="O que vale a pena lembrar?" /><select value={memoryCategory} onChange={(e) => setMemoryCategory(e.target.value)}><option>Pessoal</option><option>Projeto</option><option>Preferência</option><option>Técnica</option><option>Ideia</option></select><button type="submit" disabled={!memoryInput.trim()}>＋ Adicionar</button></form></div><div className="section-heading memory-heading"><h3>Registros de memória</h3><span className="subtle-count">{memories.length} itens</span></div><div className="memory-grid">{memories.map((memory) => <article key={memory.id} className="memory-card panel"><div className="memory-card-top"><span className="memory-type">{memory.category}</span><span className="memory-dots">···</span></div><h3>{memory.title}</h3><p>{memory.body}</p><div className="memory-card-footer"><span>◷ {memory.date}</span><span>LOCAL / DEMO</span></div></article>)}</div>{memories.length === 0 && <EmptyState text="Nenhuma memória corresponde à sua busca." />}</>;
}

function Projects({ projects, projectInput, setProjectInput, addProject }: { projects: Project[]; projectInput: string; setProjectInput: (value: string) => void; addProject: (event: FormEvent<HTMLFormElement>) => void }) {
  return <><div className="page-toolbar"><div><span className="toolbar-kicker">PORTFÓLIO PESSOAL</span><p>{projects.length} projetos nesta sessão</p></div><form className="create-inline" onSubmit={addProject}><input value={projectInput} onChange={(e) => setProjectInput(e.target.value)} placeholder="Nome do novo projeto" /><button type="submit" disabled={!projectInput.trim()}>＋ Novo projeto</button></form></div><div className="project-cards">{projects.map((project) => <article className="project-card panel" key={project.id}><div className="project-card-top"><div className={`project-symbol large ${project.color}`}>{project.name.slice(0, 1).toUpperCase()}</div><span className="project-status-pill">{project.status}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="project-card-progress"><span>Progresso</span><strong>{project.progress}%</strong></div><div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div><div className="project-card-bottom"><span>Atualizado nesta sessão</span><button onClick={() => window.alert("Detalhes completos de projeto serão implementados na próxima fase.")}>Detalhes ↗</button></div></article>)}</div>{projects.length === 0 && <EmptyState text="Nenhum projeto encontrado." />}</>;
}

function Tasks({ tasks, taskInput, setTaskInput, addTask, toggleTask }: { tasks: Task[]; taskInput: string; setTaskInput: (value: string) => void; addTask: (event: FormEvent<HTMLFormElement>) => void; toggleTask: (id: number) => void }) {
  const pending = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);
  return <><div className="task-summary-row"><div className="task-summary panel"><span>EM ABERTO</span><strong>{String(pending.length).padStart(2, "0")}</strong></div><div className="task-summary panel"><span>CONCLUÍDAS</span><strong>{String(done.length).padStart(2, "0")}</strong></div><div className="task-summary panel"><span>TOTAL</span><strong>{String(tasks.length).padStart(2, "0")}</strong></div></div><form className="task-create panel" onSubmit={addTask}><span className="create-plus">＋</span><input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Adicione uma tarefa..." /><button type="submit" disabled={!taskInput.trim()}>Adicionar tarefa</button></form><section className="panel full-task-panel"><SectionHeading title="A fazer" /><div className="task-list expanded">{pending.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}</div>{pending.length === 0 && <EmptyState text="Tudo em dia. Nenhuma tarefa pendente." />}</section><section className="panel full-task-panel done-panel"><SectionHeading title="Concluídas" /><div className="task-list expanded">{done.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}</div>{done.length === 0 && <p className="empty-inline">As tarefas concluídas aparecerão aqui.</p>}</section></>;
}

function Knowledge({ search }: { search: string }) {
  const docs = [{ title: "Visão e princípios do produto", type: "DOCUMENTO", detail: "Propósito, objetivos e princípios fundamentais do D.A.R.V.I.S.", updated: "17 nov 2026", icon: "◈" }, { title: "Arquitetura técnica", type: "ARQUITETURA", detail: "Componentes, tecnologias e responsabilidades planejadas.", updated: "17 nov 2026", icon: "⌘" }, { title: "Roadmap de desenvolvimento", type: "ROADMAP", detail: "Fases de implementação do protótipo à experiência multiplataforma.", updated: "17 nov 2026", icon: "↗" }, { title: "Direção visual e UX", type: "DESIGN", detail: "Identidade, componentes, acessibilidade e comportamento responsivo.", updated: "17 nov 2026", icon: "▧" }].filter((doc) => `${doc.title} ${doc.detail} ${doc.type}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="knowledge-banner panel"><div className="knowledge-banner-icon">▤</div><div><span className="toolbar-kicker">KNOWLEDGE VAULT</span><h2>Conhecimento conectado.</h2><p>O espaço está preparado para receber documentos e notas Markdown. A sincronização com Obsidian ainda não está ativa.</p></div><span className="planned-pill">ESTRUTURA DEMO</span></div><div className="section-heading knowledge-heading"><h3>Biblioteca</h3><span className="subtle-count">{docs.length} documentos</span></div><div className="knowledge-list">{docs.map((doc) => <div className="knowledge-item panel" key={doc.title}><div className="knowledge-doc-icon">{doc.icon}</div><div className="knowledge-doc-copy"><span>{doc.type}</span><strong>{doc.title}</strong><p>{doc.detail}</p></div><div className="knowledge-doc-date">{doc.updated}</div><span className="knowledge-arrow">↗</span></div>)}</div>{docs.length === 0 && <EmptyState text="Nenhum documento corresponde à busca." />}</>;
}

function Automations({ enabled, setEnabled, notify }: { enabled: boolean[]; setEnabled: (value: boolean[]) => void; notify: (message: string) => void }) {
  const routines = [{ name: "Resumo diário", desc: "Preparar um resumo de tarefas, projetos e compromissos.", schedule: "Todos os dias · 08:00", icon: "◷" }, { name: "Captura pelo Telegram", desc: "Receber mensagens e classificá-las na caixa de entrada.", schedule: "Ao receber mensagem", icon: "➤" }, { name: "Sincronização Obsidian", desc: "Atualizar notas Markdown entre o Vault e o núcleo.", schedule: "A cada 30 minutos", icon: "◈" }];
  return <><div className="automation-notice"><span>ⓘ</span><p><strong>Controles demonstrativos.</strong> Alternar uma rotina aqui apenas altera o visual desta sessão. Nenhuma automação ou tarefa externa será executada.</p></div><div className="automation-list">{routines.map((routine, index) => <div className="automation-item panel" key={routine.name}><div className="automation-icon">{routine.icon}</div><div className="automation-copy"><strong>{routine.name}</strong><p>{routine.desc}</p><span>{routine.schedule}</span></div><button className={`toggle ${enabled[index] ? "on" : ""}`} onClick={() => { const next = [...enabled]; next[index] = !next[index]; setEnabled(next); notify("Estado visual da rotina atualizado (demo)."); }} aria-label={`Alternar ${routine.name}`}><i /></button><span className={`automation-state ${enabled[index] ? "selected" : ""}`}>{enabled[index] ? "Selecionada" : "Desativada"}</span></div>)}</div><div className="agent-placeholder panel"><div className="agent-orb">✳</div><div><span className="toolbar-kicker">AGENTES ESPECIALIZADOS</span><h3>Agentes, ferramentas e permissões.</h3><p>A arquitetura futura permitirá agentes por domínio, com escopos definidos, logs e aprovação humana para ações sensíveis.</p></div><span className="planned-pill">PLANEJADO</span></div></>;
}

function Integrations({ notify }: { notify: (message: string) => void }) {
  const integrations = [
    { name: "Google Gemini", desc: "Modelo de linguagem e raciocínio principal.", category: "INTELIGÊNCIA ARTIFICIAL", icon: "✳", status: "Planejada", tone: "gemini" },
    { name: "Telegram", desc: "Canal de captura rápida e interação por mensagens.", category: "COMUNICAÇÃO", icon: "➤", status: "Planejada", tone: "telegram" },
    { name: "Obsidian", desc: "Vault Markdown como ambiente de conhecimento pessoal.", category: "MEMÓRIA E CONHECIMENTO", icon: "◈", status: "Planejada", tone: "obsidian" },
    { name: "Supabase", desc: "PostgreSQL gerenciado, autenticação e armazenamento.", category: "INFRAESTRUTURA", icon: "◫", status: "Planejada", tone: "supabase" },
    { name: "GitHub", desc: "Versionamento, issues e pipeline de integração contínua.", category: "DESENVOLVIMENTO", icon: "⌘", status: "Planejada", tone: "github" },
    { name: "Google Calendar", desc: "Compromissos, disponibilidade e agenda.", category: "PRODUTIVIDADE", icon: "▦", status: "Planejada", tone: "calendar" },
  ];
  return <><div className="integration-banner"><div><span className="toolbar-kicker">ECOSSISTEMA CONECTADO</span><h2>Suas ferramentas, um único núcleo.</h2><p>Estas integrações fazem parte do plano de produto. Nenhuma conta ou serviço foi conectado nesta versão.</p></div><div className="integration-count"><strong>00<span>/06</span></strong><small>CONEXÕES ATIVAS</small></div></div><div className="integration-grid">{integrations.map((integration) => <article className="integration-card panel" key={integration.name}><div className="integration-card-top"><div className={`integration-brand ${integration.tone}`}>{integration.icon}</div><span className="planned-pill">PLANEJADA</span></div><span className="integration-category">{integration.category}</span><h3>{integration.name}</h3><p>{integration.desc}</p><div className="integration-card-bottom"><span><StatusDot color="muted" /> Não conectada</span><button onClick={() => notify(`${integration.name}: conexão ainda não implementada.`)}>Ver detalhes ↗</button></div></article>)}</div></>;
}

function Settings({ notify }: { notify: (message: string) => void }) {
  return <><div className="settings-grid"><section className="panel settings-panel"><div className="settings-section-title"><div className="settings-icon">◉</div><div><h3>Perfil e workspace</h3><p>Identificação do ambiente pessoal.</p></div></div><div className="settings-field"><label>Nome de exibição</label><input value="David Abrahão" readOnly /></div><div className="settings-field"><label>Nome do workspace</label><input value="Meu workspace" readOnly /></div><div className="settings-field"><label>Idioma</label><input value="Português (Brasil)" readOnly /></div></section><section className="panel settings-panel"><div className="settings-section-title"><div className="settings-icon violet-icon">✳</div><div><h3>Provedor de IA</h3><p>Configuração será feita pelo backend, nunca pelo navegador.</p></div></div><div className="settings-info"><span>Provedor padrão</span><strong>Google Gemini <em>Planejado</em></strong></div><div className="settings-info"><span>Chave de API</span><strong className="muted-value">Não configurada</strong></div><div className="settings-info"><span>Fallback multi-modelo</span><strong className="muted-value">Não implementado</strong></div></section><section className="panel settings-panel"><div className="settings-section-title"><div className="settings-icon blue-icon">⌑</div><div><h3>Privacidade e segurança</h3><p>Controles previstos para a versão integrada.</p></div></div>{["Autenticação e sessões", "Permissões por ferramenta", "Logs de auditoria", "Backup e recuperação"].map((label) => <div className="setting-check-row" key={label}><span>{label}</span><span className="planned-pill">PLANEJADO</span></div>)}</section><section className="panel settings-panel"><div className="settings-section-title"><div className="settings-icon amber-icon">◌</div><div><h3>Dados desta demonstração</h3><p>Comportamento atual do protótipo.</p></div></div><div className="settings-info"><span>Persistência</span><strong className="muted-value">Somente em memória</strong></div><div className="settings-info"><span>Integrações externas</span><strong className="muted-value">Nenhuma</strong></div><button className="secondary-action" onClick={() => notify("A limpeza automática estará disponível em uma próxima versão.")}>Gerenciar dados locais <span>↗</span></button></section></div><div className="security-footnote"><span>ⓘ</span> Não insira senhas, tokens ou chaves de API nesta demonstração. Credenciais serão tratadas no backend em uma fase posterior.</div></>;
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>◌</span><p>{text}</p></div>; }
