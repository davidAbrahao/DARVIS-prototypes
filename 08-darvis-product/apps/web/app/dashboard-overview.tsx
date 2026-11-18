"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Circle,
  Clock3,
  FolderKanban,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Target,
  Timer,
  X,
} from "lucide-react";

import { ApiError } from "../lib/auth-api";
import { useAuth } from "./auth-provider";

type DashboardSummary = {
  projects_total: number;
  projects_active: number;
  tasks_total: number;
  tasks_open: number;
  tasks_completed: number;
  tasks_due_soon: number;
};

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "on_hold" | "completed" | "archived";
  created_at: string;
  updated_at: string;
};

type Task = {
  id: number;
  project_id: number | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "blocked" | "done" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DashboardData = {
  summary: DashboardSummary;
  tasks: Task[];
  projects: Project[];
};

const emptySummary: DashboardSummary = {
  projects_total: 0,
  projects_active: 0,
  tasks_total: 0,
  tasks_open: 0,
  tasks_completed: 0,
  tasks_due_soon: 0,
};

const taskStatusLabel: Record<Task["status"], string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluída",
  cancelled: "Cancelada",
};

const priorityLabel: Record<Task["priority"], string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

function formatDueDate(value: string | null): string {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function DashboardOverview() {
  const { apiRequest } = useAuth();
  const [data, setData] = useState<DashboardData>({
    summary: emptySummary,
    tasks: [],
    projects: [],
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  // TASK_INLINE_EDIT_V1
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [savingTaskEdit, setSavingTaskEdit] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<Task["priority"]>("normal");
  const [editTaskProjectId, setEditTaskProjectId] = useState("");
  const [editTaskDueAt, setEditTaskDueAt] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("normal");
  const [newTaskDueAt, setNewTaskDueAt] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, tasks, projects] = await Promise.all([
        apiRequest<DashboardSummary>("/dashboard/summary"),
        apiRequest<Task[]>("/tasks?limit=6"),
        apiRequest<Project[]>("/projects?limit=100"),
      ]);
      setData({ summary, tasks, projects });
      setHasLoaded(true);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar os dados do ambiente.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    let current = true;

    Promise.all([
      apiRequest<DashboardSummary>("/dashboard/summary"),
      apiRequest<Task[]>("/tasks?limit=6"),
      apiRequest<Project[]>("/projects?limit=100"),
    ])
      .then(([summary, tasks, projects]) => {
        if (!current) return;
        setData({ summary, tasks, projects });
        setHasLoaded(true);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (current) {
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Não foi possível carregar os dados do ambiente.",
          );
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [apiRequest]);

  const projectNames = useMemo(
    () =>
      new Map<number, string>(
        data.projects.map((project) => [project.id, project.name] as const),
      ),
    [data.projects],
  );

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    setError(null);
    try {
      await apiRequest<Task>("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status: "todo",
          priority: newTaskPriority,
          project_id: newTaskProjectId ? Number(newTaskProjectId) : null,
          due_at: newTaskDueAt ? new Date(newTaskDueAt).toISOString() : null,
        }),
      });
      setNewTaskTitle("");
      setNewTaskProjectId("");
      setNewTaskPriority("normal");
      setNewTaskDueAt("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível salvar a tarefa.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name || savingProject) return;

    setSavingProject(true);
    setError(null);
    try {
      await apiRequest<Project>("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewProjectName("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível salvar o projeto.",
      );
    } finally {
      setSavingProject(false);
    }
  }

  async function changeProjectStatus(project: Project, status: Project["status"]) {
    if (project.status === status) return;
    setError(null);
    try {
      await apiRequest<Project>(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível atualizar o projeto.",
      );
    }
  }

  async function changeTaskStatus(task: Task, status: Task["status"]) {
    if (task.status === status) return;
    setError(null);
    try {
      await apiRequest<Task>(`/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível atualizar a tarefa.",
      );
    }
  }

  async function completeTask(task: Task) {
    if (task.status === "done" || task.status === "cancelled") return;
    await changeTaskStatus(task, "done");
  }

  // TASK_INLINE_EDIT_V1
  function beginEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description ?? "");
    setEditTaskPriority(task.priority);
    setEditTaskProjectId(task.project_id === null ? "" : String(task.project_id));
    setEditTaskDueAt(toDateTimeLocal(task.due_at));
  }

  function cancelEditTask() {
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskPriority("normal");
    setEditTaskProjectId("");
    setEditTaskDueAt("");
  }

  async function saveTaskEdit(event: FormEvent<HTMLFormElement>, task: Task) {
    event.preventDefault();
    const title = editTaskTitle.trim();
    if (!title || savingTaskEdit) return;

    setSavingTaskEdit(true);
    setError(null);
    try {
      await apiRequest<Task>(`/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: editTaskDescription.trim() || null,
          priority: editTaskPriority,
          project_id: editTaskProjectId ? Number(editTaskProjectId) : null,
          due_at: editTaskDueAt ? new Date(editTaskDueAt).toISOString() : null,
        }),
      });
      cancelEditTask();
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível atualizar a tarefa.",
      );
    } finally {
      setSavingTaskEdit(false);
    }
  }

  const stats = [
    { label: "Projetos ativos", value: data.summary.projects_active, icon: FolderKanban, note: `${data.summary.projects_total} no total` },
    { label: "Tarefas em aberto", value: data.summary.tasks_open, icon: Target, note: "Acompanhamento atual" },
    { label: "Concluídas", value: data.summary.tasks_completed, icon: Check, note: "Registradas no sistema" },
    { label: "Próximos 7 dias", value: data.summary.tasks_due_soon, icon: Timer, note: "Com prazo definido" },
  ];

  return (
    <section className="dashboard-overview" aria-label="Dados reais de tarefas e projetos">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SEU ESPAÇO COGNITIVO</span>
          <h2>Seu centro de comando</h2>
        </div>
        <button
          className="dashboard-refresh"
          type="button"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "auth-spin" : ""} />
          Atualizar dados
        </button>
      </div>

      {error ? (
        <div className="dashboard-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>Tentar novamente</button>
        </div>
      ) : null}

      <div className="module-grid dashboard-stat-grid">
        {stats.map(({ label, value, icon: Icon, note }) => (
          <article className="module-card dashboard-stat-card" key={label}>
            <div className="module-top">
              <span className="module-icon"><Icon size={19} /></span>
              <span className="module-index">API</span>
            </div>
            <strong className="dashboard-stat-value">
              {loading && !hasLoaded ? (
                <LoaderCircle size={21} className="auth-spin" />
              ) : !hasLoaded && error ? "—" : value}
            </strong>
            <h3>{label}</h3>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-data-grid">
        <article className="panel dashboard-tasks-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EXECUÇÃO</span>
              <h2>Suas tarefas</h2>
            </div>
            <span className="dashboard-count">
              {hasLoaded ? data.summary.tasks_open : "—"} abertas
            </span>
          </div>

          <form className="quick-task-form" onSubmit={createTask}>
            <div className="quick-task-main-row">
              <input
                type="text"
                aria-label="Título da nova tarefa"
                placeholder="Adicionar uma tarefa..."
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                maxLength={180}
                required
              />
              <button type="submit" disabled={saving || !newTaskTitle.trim()}>
                {saving ? <LoaderCircle size={16} className="auth-spin" /> : <Plus size={16} />}
                Adicionar
              </button>
            </div>
            <div className="quick-task-options">
              <label>
                <span className="sr-only">Prioridade</span>
                <select
                  value={newTaskPriority}
                  onChange={(event) =>
                    setNewTaskPriority(event.target.value as Task["priority"])
                  }
                  aria-label="Prioridade da nova tarefa"
                >
                  <option value="low">Prioridade baixa</option>
                  <option value="normal">Prioridade normal</option>
                  <option value="high">Prioridade alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Projeto</span>
                <select
                  value={newTaskProjectId}
                  onChange={(event) => setNewTaskProjectId(event.target.value)}
                  aria-label="Projeto da nova tarefa"
                >
                  <option value="">Sem projeto</option>
                  {data.projects.map((project) => (
                    <option value={project.id} key={project.id}>{project.name}</option>
                  ))}
                </select>
              </label>
              <label className="quick-task-due">
                <span className="sr-only">Prazo</span>
                <input
                  type="datetime-local"
                  value={newTaskDueAt}
                  onChange={(event) => setNewTaskDueAt(event.target.value)}
                  aria-label="Prazo da nova tarefa"
                />
              </label>
            </div>
          </form>

          {loading ? (
            <div className="dashboard-empty"><LoaderCircle size={18} className="auth-spin" /> Carregando tarefas…</div>
          ) : !hasLoaded && error ? (
            <div className="dashboard-empty">
              <AlertCircle size={18} />
              <span>Os dados de tarefas ainda não puderam ser consultados.</span>
            </div>
          ) : data.tasks.length === 0 ? (
            <div className="dashboard-empty">
              <Circle size={18} />
              <span>Nenhuma tarefa registrada. Adicione a primeira acima.</span>
            </div>
          ) : (
            <div className="dashboard-task-list">
              {data.tasks.map((task) => (
                <div className="dashboard-task-item" key={task.id}>
                  <div className="dashboard-task-row">
                    <button
                      type="button"
                      className={`task-complete-button ${task.status === "done" ? "is-done" : ""}`}
                      onClick={() => void completeTask(task)}
                      disabled={task.status === "done" || task.status === "cancelled"}
                      aria-label={task.status === "done" ? "Tarefa concluída" : `Concluir ${task.title}`}
                    >
                      {task.status === "done" ? <Check size={14} /> : <Circle size={15} />}
                    </button>
                    <div className="dashboard-task-copy">
                      <strong className={task.status === "done" ? "task-title-done" : ""}>{task.title}</strong>
                      <span>
                        {task.project_id ? projectNames.get(task.project_id) ?? "Projeto" : "Pessoal"}
                        <span className="task-meta-separator">·</span>
                        {taskStatusLabel[task.status]}
                      </span>
                    </div>
                    <div className="dashboard-task-meta">
                      <span className={`priority-label priority-${task.priority}`}>{priorityLabel[task.priority]}</span>
                      <span><Clock3 size={12} /> {formatDueDate(task.due_at)}</span>
                      <button type="button" className="task-edit-button"
                        onClick={() => beginEditTask(task)} disabled={savingTaskEdit}
                        aria-label={`Editar ${task.title}`} title="Editar tarefa">
                        <Pencil size={13} />
                      </button>
                      <label className="task-status-control">
                        <span className="sr-only">Situação de {task.title}</span>
                        <select value={task.status}
                          onChange={(event) => void changeTaskStatus(task, event.target.value as Task["status"])}
                          aria-label={`Situação de ${task.title}`}
                          disabled={savingTaskEdit && editingTaskId === task.id}>
                          <option value="todo">A fazer</option>
                          <option value="in_progress">Em andamento</option>
                          <option value="blocked">Bloqueada</option>
                          <option value="done">Concluída</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  {editingTaskId === task.id ? (
                    <form className="task-edit-form" onSubmit={(event) => void saveTaskEdit(event, task)}>
                      <label className="task-edit-title">
                        <span>Título</span>
                        <input value={editTaskTitle} onChange={(event) => setEditTaskTitle(event.target.value)} maxLength={180} required />
                      </label>
                      <label className="task-edit-description">
                        <span>Descrição</span>
                        <textarea value={editTaskDescription} onChange={(event) => setEditTaskDescription(event.target.value)}
                          maxLength={5000} rows={2} placeholder="Adicione detalhes (opcional)" />
                      </label>
                      <div className="task-edit-fields">
                        <label><span>Prioridade</span>
                          <select value={editTaskPriority} onChange={(event) => setEditTaskPriority(event.target.value as Task["priority"])}>
                            <option value="low">Baixa</option><option value="normal">Normal</option>
                            <option value="high">Alta</option><option value="urgent">Urgente</option>
                          </select>
                        </label>
                        <label><span>Projeto</span>
                          <select value={editTaskProjectId} onChange={(event) => setEditTaskProjectId(event.target.value)}>
                            <option value="">Sem projeto</option>
                            {data.projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
                          </select>
                        </label>
                        <label><span>Prazo</span>
                          <input type="datetime-local" value={editTaskDueAt} onChange={(event) => setEditTaskDueAt(event.target.value)} />
                        </label>
                      </div>
                      <div className="task-edit-actions">
                        <button type="button" className="task-edit-cancel" onClick={cancelEditTask} disabled={savingTaskEdit}>
                          <X size={13} /> Cancelar
                        </button>
                        <button type="submit" className="task-edit-save" disabled={savingTaskEdit || !editTaskTitle.trim()}>
                          {savingTaskEdit ? <LoaderCircle size={13} className="auth-spin" /> : <Save size={13} />}
                          Salvar alterações
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          <a className="dashboard-more-link" href="#projects">
            Ver projetos <ArrowUpRight size={14} />
          </a>
        </article>

        <article className="panel dashboard-projects-panel" id="projects">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DIREÇÃO</span>
              <h2>Projetos</h2>
            </div>
            <span className="dashboard-count">
              {hasLoaded ? data.summary.projects_total : "—"} registrados
            </span>
          </div>

          <form className="quick-project-form" onSubmit={createProject}>
            <input
              type="text"
              aria-label="Nome do novo projeto"
              placeholder="Criar um projeto..."
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              maxLength={120}
              required
            />
            <button type="submit" disabled={savingProject || !newProjectName.trim()}>
              {savingProject ? <LoaderCircle size={15} className="auth-spin" /> : <Plus size={15} />}
              Criar
            </button>
          </form>

          {loading ? (
            <div className="dashboard-empty"><LoaderCircle size={18} className="auth-spin" /> Carregando projetos…</div>
          ) : !hasLoaded && error ? (
            <div className="dashboard-empty">
              <AlertCircle size={18} />
              <span>Os dados de projetos ainda não puderam ser consultados.</span>
            </div>
          ) : data.projects.length === 0 ? (
            <div className="dashboard-empty">
              <FolderKanban size={18} />
              <span>Seus projetos aparecerão aqui quando forem criados.</span>
            </div>
          ) : (
            <div className="dashboard-project-list">
              {data.projects.map((project) => (
                <div className="dashboard-project-row" key={project.id}>
                  <span className="dashboard-project-icon"><FolderKanban size={16} /></span>
                  <div>
                    <strong>{project.name}</strong>
                    <small>{project.description || "Sem descrição"}</small>
                  </div>
                  <label className="project-status-control">
                    <span className="sr-only">Situação de {project.name}</span>
                    <select
                      className={`project-status project-${project.status}`}
                      value={project.status}
                      onChange={(event) =>
                        void changeProjectStatus(project, event.target.value as Project["status"])
                      }
                    >
                      <option value="active">Ativo</option>
                      <option value="on_hold">Em espera</option>
                      <option value="completed">Concluído</option>
                      <option value="archived">Arquivado</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          )}
          <div className="dashboard-project-footer">
            <span>
              {loading
                ? "Consultando PostgreSQL"
                : error
                  ? "Última consulta indisponível"
                  : "PostgreSQL confirmado pela API"}
            </span>
            <span className="dashboard-data-source">{hasLoaded && !error ? "API" : "—"}</span>
          </div>
        </article>
      </div>
    </section>
  );
}
