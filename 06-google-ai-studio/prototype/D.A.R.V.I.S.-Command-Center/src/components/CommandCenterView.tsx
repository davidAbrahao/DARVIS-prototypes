import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Brain,
  Check,
  FolderKanban,
  ListTodo,
  Plug,
  Send,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { PLANNED_INTEGRATIONS } from '../data/seedData';
import {
  calculateProjectProgress,
  computeDashboardMetrics,
  getContextualGreeting,
} from '../lib/darvisLogic';
import type {
  DarvisState,
  DarvisTheme,
  GoalDomain,
  MemoryCategory,
  ModuleId,
  TaskPriority,
  TaskStatus,
} from '../types/darvis';
import { DailyDigestWidget } from './DailyDigestWidget';
import { DailyFocusWidget } from './DailyFocusWidget';
import { DailyHabitsWidget } from './DailyHabitsWidget';
import { FocusTimerWidget } from './FocusTimerWidget';
import { LongTermGoalsWidget } from './LongTermGoalsWidget';
import { MaturityTag } from './MaturityTag';
import { QuickActionsBar } from './QuickActionsBar';
import { Skeleton } from './Skeleton';
import { TaskInsightsWidget } from './TaskInsightsWidget';
import { ThemeSwitcherWidget } from './ThemeSwitcherWidget';
import { WeatherWidget } from './WeatherWidget';

interface CommandCenterViewProps {
  state: DarvisState;
  isLoading?: boolean;
  aiConfigured: boolean | null;
  aiThinking: boolean;
  onNavigate: (module: ModuleId) => void;
  onSendCommand: (prompt: string) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onAddTask: (input: {
    title: string;
    category: string;
    priority: TaskPriority;
    dueDate: string;
  }) => void;
  onAddMemory: (input: {
    title: string;
    content: string;
    category: MemoryCategory;
    tags: string[];
    source?: 'Manual';
  }) => void;
  onSaveNote: (note: {
    title: string;
    folder: string;
    content: string;
    tags: string[];
  }) => void;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (input: { title: string; category: string; targetLabel: string }) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleGoalMilestone: (goalId: string, milestoneId: string) => void;
  onAddGoal: (input: {
    title: string;
    domain: GoalDomain;
    horizon: string;
    firstMilestone: string;
  }) => void;
  onSelectTheme: (theme: DarvisTheme) => void;
}

export function CommandCenterView({
  state,
  isLoading = false,
  aiConfigured,
  aiThinking,
  onNavigate,
  onSendCommand,
  onUpdateTaskStatus,
  onAddTask,
  onAddMemory,
  onSaveNote,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onToggleGoalMilestone,
  onAddGoal,
  onSelectTheme,
}: CommandCenterViewProps) {
  const [commandInput, setCommandInput] = useState('');

  const nowHour = new Date().getHours();
  const { greeting, periodLabel } = getContextualGreeting(
    nowHour,
    state.settings.userName
  );
  const metrics = computeDashboardMetrics(state);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = commandInput.trim();
    if (!trimmed) return;
    setCommandInput('');
    onSendCommand(trimmed);
  };

  const openTasks = state.tasks.filter((t) => t.status !== 'concluida').slice(0, 4);
  const activeProjects = state.projects.slice(0, 3);
  const recentMemories = state.memories.slice(0, 3);
  const recentAudit = state.auditLog.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Hero Command Interaction Zone */}
      <section className="rounded-xl bg-surface border border-edge p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-accent-text mb-2">
              {periodLabel}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-balance">
              {greeting}
            </h2>
            <p className="text-sm text-ink-muted mt-1.5 max-w-2xl">
              David Abrahão Rodrigues Virtual Intelligence System — central unificada de
              raciocínio, memória persistente, gestão pessoal e governança.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <MaturityTag
              maturity={aiConfigured ? 'implemented' : 'simulated'}
              labelOverride={
                aiConfigured
                  ? 'Gemini API Ativo'
                  : 'Protótipo Fase 1 · Dados Demo'
              }
            />
          </div>
        </div>

        {/* Main Natural Language Command Field */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="command-center-input" className="sr-only">
            Comando em linguagem natural para o D.A.R.V.I.S.
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="command-center-input"
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Pergunte ao D.A.R.V.I.S., peça uma análise de prioridades ou solicite o registro de uma tarefa..."
              className="flex-1 bg-inset border border-edge-strong rounded-lg px-4 py-3 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!commandInput.trim() || aiThinking}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-accent-ink font-medium text-sm hover:bg-accent-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{aiThinking ? 'Enviando...' : 'Enviar Comando'}</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>Sugestões rápidas:</span>
            <button
              type="button"
              onClick={() =>
                onSendCommand(
                  'Resuma minhas prioridades atuais considerando minhas tarefas e projetos.'
                )
              }
              className="text-accent-text hover:underline underline-offset-4 whitespace-nowrap"
            >
              Analisar prioridades
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() =>
                onSendCommand(
                  'Proponha uma nova tarefa para revisar o schema PostgreSQL da Fase 2.'
                )
              }
              className="text-accent-text hover:underline underline-offset-4 whitespace-nowrap"
            >
              Propor tarefa com aprovação
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() =>
                onSendCommand(
                  'Quais integrações externas já estão conectadas no sistema atual?'
                )
              }
              className="text-accent-text hover:underline underline-offset-4 whitespace-nowrap"
            >
              Auditar integrações
            </button>
          </div>
        </form>
      </section>

      {/* Quick Actions Row */}
      <QuickActionsBar
        onAddTask={onAddTask}
        onAddMemory={onAddMemory}
        onSaveNote={onSaveNote}
        onNavigate={onNavigate}
      />

      {/* Summary KPI Strip */}
      <section aria-label="Resumo operacional" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('management')}
          className="text-left rounded-xl bg-surface border border-edge p-5 hover:border-edge-strong transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span>Tarefas Pendentes</span>
            <ListTodo className="w-4 h-4 text-accent-text" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink tabular-nums">
            {metrics.pendingTasks}
          </p>
          <p className="text-xs text-ink-subtle mt-1 tabular-nums">
            {metrics.highPriorityTasks} de alta prioridade · {metrics.completedTasks} concluídas
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('projects')}
          className="text-left rounded-xl bg-surface border border-edge p-5 hover:border-edge-strong transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span>Projetos Ativos</span>
            <FolderKanban className="w-4 h-4 text-accent-text" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink tabular-nums">
            {state.projects.length}
          </p>
          <p className="text-xs text-ink-subtle mt-1 tabular-nums">
            {metrics.activeProjects} em execução · {metrics.upcomingCommitments} compromissos
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('memory')}
          className="text-left rounded-xl bg-surface border border-edge p-5 hover:border-edge-strong transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span className="truncate">Memórias</span>
            <Brain className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink tabular-nums">
            {metrics.totalMemories}
          </p>
          <p className="text-xs text-ink-subtle mt-1 tabular-nums">
            {metrics.totalNotes} notas na base de conhecimento
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('automations')}
          className="text-left rounded-xl bg-surface border border-edge p-5 hover:border-edge-strong transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span>Automações</span>
            <Workflow className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl font-semibold text-ink tabular-nums">
            {state.automations.length}
          </p>
          <p className="text-xs text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700 mt-1">
            Simulação local · Workers planejados
          </p>
        </button>
      </section>

      {/* Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Column 1-2: Daily Focus + Focus Timer, Tasks & Projects */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <DailyFocusWidget
              userName={state.settings.userName}
              pendingTasksCount={metrics.pendingTasks}
              activeProjectsCount={metrics.activeProjects}
              aiConfigured={aiConfigured}
              isLoading={isLoading}
            />

            <FocusTimerWidget isLoading={isLoading} />
          </div>

          <DailyDigestWidget
            tasks={state.tasks}
            projects={state.projects}
            commitments={state.commitments}
            userName={state.settings.userName}
            isLoading={isLoading}
            onNavigate={onNavigate}
          />

          {/* Tasks Summary */}
          <section className="rounded-xl bg-surface border border-edge p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Tarefas & Compromissos Prioritários
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Marque para concluir ou acesse o gestor completo
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('management')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-text hover:underline whitespace-nowrap shrink-0"
              >
                <span>Ver tudo</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {isLoading ? (
              <div
                role="status"
                aria-busy="true"
                aria-label="Carregando tarefas prioritárias"
                data-testid="tasks-skeleton"
              >
                <span className="sr-only">Carregando tarefas...</span>
                <ul className="divide-y divide-edge">
                  {[0, 1, 2].map((idx) => (
                    <li key={idx} className="py-3 flex items-start gap-3">
                      <Skeleton className="mt-0.5 w-5 h-5 rounded shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3.5 w-3/5" />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-edge flex items-center justify-between gap-4">
                  <Skeleton className="h-3.5 w-64" />
                  <Skeleton className="h-3.5 w-28 shrink-0" />
                </div>
              </div>
            ) : (
              <>
                {openTasks.length === 0 ? (
                  <p className="text-sm text-ink-muted py-4">
                    Nenhuma tarefa pendente no momento.
                  </p>
                ) : (
                  <ul className="divide-y divide-edge">
                    {openTasks.map((task) => (
                      <li
                        key={task.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => onUpdateTaskStatus(task.id, 'concluida')}
                            aria-label={`Concluir tarefa ${task.title}`}
                            className="mt-0.5 w-5 h-5 rounded border border-edge-strong hover:border-accent-text flex items-center justify-center text-transparent hover:text-accent-text transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm text-ink truncate">{task.title}</p>
                            <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                              {task.category} · Prioridade {task.priority} · Prazo {task.dueDate}
                              {task.isDemo ? ' · Demo' : ''}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Next commitment */}
                {state.commitments[0] && (
                  <div className="mt-4 pt-4 border-t border-edge flex items-center justify-between gap-4 text-xs">
                    <span className="text-ink-muted">
                      Próximo compromisso:{' '}
                      <strong className="text-ink font-medium">
                        {state.commitments[0].title}
                      </strong>
                    </span>
                    <span className="font-mono text-ink-muted tabular-nums shrink-0">
                      {state.commitments[0].dateTime}
                    </span>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Active Projects */}
          <section className="rounded-xl bg-surface border border-edge p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Projetos em Curso
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Evolução de objetivos e etapas do ecossistema
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-text hover:underline whitespace-nowrap shrink-0"
              >
                <span>Abrir projetos</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {isLoading ? (
              <div
                role="status"
                aria-busy="true"
                aria-label="Carregando projetos em curso"
                data-testid="projects-skeleton"
                className="divide-y divide-edge"
              >
                <span className="sr-only">Carregando projetos...</span>
                {[0, 1].map((idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3.5 w-28 shrink-0" />
                    </div>
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-edge">
                {activeProjects.map((project) => {
                  const progress = calculateProjectProgress(project.milestones);
                  return (
                    <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4 mb-1.5">
                        <p className="text-sm font-medium text-ink">
                          {project.name}
                        </p>
                        <span className="font-mono text-xs text-accent-text tabular-nums shrink-0">
                          {progress.completed}/{progress.total} etapas ({progress.percentage}%)
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mb-3">{project.objective}</p>
                      <div className="w-full h-1.5 bg-track rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <LongTermGoalsWidget
            goals={state.longTermGoals}
            projects={state.projects}
            isLoading={isLoading}
            onToggleMilestone={onToggleGoalMilestone}
            onAddGoal={onAddGoal}
            onNavigate={onNavigate}
          />

          <WeatherWidget isLoading={isLoading} />
        </div>

        {/* Column 3: Task Insights, Theme Switcher, Memory Quick Access, Integrations Status & Audit Activity */}
        <div className="space-y-6">
          <TaskInsightsWidget
            tasks={state.tasks}
            isLoading={isLoading}
            onNavigate={onNavigate}
          />

          <DailyHabitsWidget
            habits={state.dailyHabits}
            isLoading={isLoading}
            onToggleHabit={onToggleHabit}
            onAddHabit={onAddHabit}
            onDeleteHabit={onDeleteHabit}
          />

          <ThemeSwitcherWidget
            currentTheme={state.settings.theme ?? 'deep-space'}
            onSelectTheme={onSelectTheme}
          />

          {/* Quick Memory */}
          <section className="rounded-xl bg-surface border border-edge p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-display text-base font-semibold text-ink">
                Memória Recente
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('memory')}
                className="text-xs font-medium text-accent-text hover:underline whitespace-nowrap"
              >
                Acessar Central
              </button>
            </div>
            <ul className="space-y-3">
              {recentMemories.map((mem) => (
                <li
                  key={mem.id}
                  className="pb-3 last:pb-0 border-b last:border-b-0 border-edge"
                >
                  <p className="text-xs text-accent-text mb-0.5">
                    {mem.category} · {mem.source}
                  </p>
                  <p className="text-sm font-medium text-ink">{mem.title}</p>
                  <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                    {mem.content}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Honest Integrations Status */}
          <section className="rounded-xl bg-surface border border-edge p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Plug className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-ink">
                  Estado das Integrações
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('integrations')}
                className="text-xs font-medium text-accent-text hover:underline whitespace-nowrap"
              >
                Detalhes
              </button>
            </div>
            <ul className="divide-y divide-edge text-xs">
              {PLANNED_INTEGRATIONS.slice(0, 5).map((item) => {
                const isGemini = item.id === 'int-gemini';
                const effectiveMaturity = isGemini
                  ? aiConfigured
                    ? 'implemented'
                    : 'simulated'
                  : item.maturity;
                const label = isGemini
                  ? aiConfigured
                    ? 'Ativo'
                    : 'Aguardando Chave'
                  : 'Não Conectado';
                return (
                  <li
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <span className="text-ink-secondary truncate">{item.name}</span>
                    <MaturityTag maturity={effectiveMaturity} labelOverride={label} />
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Recent Activity / Audit */}
          <section className="rounded-xl bg-surface border border-edge p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-ink">
                  Atividades Recentes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-xs font-medium text-accent-text hover:underline whitespace-nowrap"
              >
                Auditoria
              </button>
            </div>
            {isLoading ? (
              <div
                role="status"
                aria-busy="true"
                aria-label="Carregando atividades recentes"
                data-testid="activity-skeleton"
              >
                <span className="sr-only">Carregando atividades recentes...</span>
                <ul className="space-y-3">
                  {[0, 1, 2].map((idx) => (
                    <li key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-3.5 w-44" />
                        <Skeleton className="h-3 w-10 shrink-0" />
                      </div>
                      <Skeleton className="h-3 w-5/6" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recentAudit.map((entry) => (
                  <li key={entry.id} className="text-xs">
                    <div className="flex items-center justify-between gap-2 text-ink-muted">
                      <span className="font-medium text-ink">{entry.action}</span>
                      <span className="font-mono text-[11px] tabular-nums shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-ink-subtle mt-0.5 truncate">{entry.details}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
