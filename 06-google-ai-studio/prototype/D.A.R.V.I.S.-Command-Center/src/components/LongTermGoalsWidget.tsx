import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Target,
  X,
} from 'lucide-react';
import { evaluateLongTermGoals, GOAL_DOMAINS } from '../lib/longTermGoals';
import type {
  GoalDomain,
  LongTermGoal,
  ModuleId,
  ProjectItem,
} from '../types/darvis';
import { Skeleton } from './Skeleton';

interface LongTermGoalsWidgetProps {
  goals: LongTermGoal[];
  projects: ProjectItem[];
  isLoading?: boolean;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onAddGoal: (input: {
    title: string;
    domain: GoalDomain;
    horizon: string;
    firstMilestone: string;
  }) => void;
  onNavigate: (module: ModuleId) => void;
}

export function LongTermGoalsWidget({
  goals,
  projects,
  isLoading = false,
  onToggleMilestone,
  onAddGoal,
  onNavigate,
}: LongTermGoalsWidgetProps) {
  const [domainFilter, setDomainFilter] = useState<'Todos' | GoalDomain>('Todos');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<GoalDomain>('Carreira & Projetos');
  const [horizon, setHorizon] = useState('2027');
  const [firstMilestone, setFirstMilestone] = useState('');

  const summary = evaluateLongTermGoals(goals, projects, domainFilter);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddGoal({
      title: title.trim(),
      domain,
      horizon: horizon.trim() || '2027',
      firstMilestone: firstMilestone.trim(),
    });
    setTitle('');
    setHorizon('2027');
    setFirstMilestone('');
    setAdding(false);
  };

  return (
    <section
      aria-label="Long-term Goals"
      data-testid="long-term-goals-widget"
      className="rounded-xl bg-surface border border-edge p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-ink">
              Long-term Goals
            </h3>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Metas estratégicas de vida e marcos estruturais de projetos
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setAdding((prev) => !prev)}
            disabled={isLoading}
            data-testid="long-term-goals-add-toggle"
            aria-expanded={adding}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline whitespace-nowrap disabled:opacity-45"
          >
            {adding ? (
              <>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Fechar</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Nova meta</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink whitespace-nowrap"
          >
            <span>Projetos</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando metas de longo prazo"
          data-testid="long-term-goals-skeleton"
          className="space-y-4"
        >
          <span className="sr-only">Carregando metas de longo prazo...</span>
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="pt-2 divide-y divide-edge">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall progress header */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <div className="flex items-baseline gap-2">
                <span
                  data-testid="long-term-goals-overall-percent"
                  className="font-display text-2xl font-semibold text-ink tabular-nums"
                >
                  {summary.overallPercentage}%
                </span>
                <span className="text-xs text-ink-muted">progresso global</span>
              </div>
              <span
                data-testid="long-term-goals-overall-counts"
                className="font-mono text-xs text-ink-muted tabular-nums"
              >
                {summary.completedMilestones}/{summary.totalMilestones} marcos ·{' '}
                {summary.totalGoals} metas
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={summary.overallPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso global das metas de longo prazo"
              className="w-full h-1.5 bg-track rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${summary.overallPercentage}%` }}
              />
            </div>
          </div>

          {/* Domain filter strip */}
          <div
            role="tablist"
            aria-label="Filtrar metas por domínio"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-edge pb-3 text-xs"
          >
            {(['Todos', ...GOAL_DOMAINS] as const).map((tab) => {
              const active = domainFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDomainFilter(tab)}
                  className={`transition-colors whitespace-nowrap ${
                    active
                      ? 'text-accent-text font-medium'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Inline creation form */}
          {adding && (
            <form
              onSubmit={handleSubmit}
              data-testid="long-term-goals-add-form"
              className="pb-4 border-b border-edge space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label htmlFor="new-goal-title" className="sr-only">
                    Título da meta de longo prazo
                  </label>
                  <input
                    id="new-goal-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex.: Dominar arquitetura distribuída em Rust..."
                    className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="new-goal-horizon" className="sr-only">
                    Horizonte da meta
                  </label>
                  <input
                    id="new-goal-horizon"
                    type="text"
                    value={horizon}
                    onChange={(e) => setHorizon(e.target.value)}
                    placeholder="Horizonte (ex.: Q2 2027)"
                    className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="new-goal-domain" className="sr-only">
                    Domínio da meta
                  </label>
                  <select
                    id="new-goal-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as GoalDomain)}
                    className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    {GOAL_DOMAINS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <label htmlFor="new-goal-milestone" className="sr-only">
                    Primeiro marco
                  </label>
                  <input
                    id="new-goal-milestone"
                    type="text"
                    value={firstMilestone}
                    onChange={(e) => setFirstMilestone(e.target.value)}
                    placeholder="Primeiro marco (opcional)"
                    className="flex-1 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                  >
                    Salvar meta
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Goals list */}
          {summary.items.length === 0 ? (
            <div className="py-4 text-xs text-ink-muted flex items-center justify-between gap-3">
              <span>Nenhuma meta cadastrada neste domínio.</span>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-accent-text font-medium hover:underline whitespace-nowrap shrink-0"
              >
                Criar meta
              </button>
            </div>
          ) : (
            <ul data-testid="long-term-goals-list" className="divide-y divide-edge">
              {summary.items.map(
                ({
                  goal,
                  milestones,
                  completedCount,
                  totalCount,
                  percentage,
                  nextMilestone,
                  isCompleted,
                  isProjectLinked,
                }) => {
                  const isExpanded = expandedGoalId === goal.id;

                  return (
                    <li key={goal.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            {goal.title}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                            {goal.domain} · {goal.horizon}
                            {isProjectLinked ? ' · Sincronizado com Projeto' : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            data-testid={`long-term-goal-percent-${goal.id}`}
                            className={`font-mono text-xs tabular-nums ${
                              isCompleted
                                ? 'text-emerald-500 [[data-theme=minimalist-light]_&]:text-emerald-700 font-medium'
                                : 'text-accent-text'
                            }`}
                          >
                            {percentage}% · {completedCount}/{totalCount}
                          </span>

                          {milestones.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedGoalId(isExpanded ? null : goal.id)
                              }
                              aria-expanded={isExpanded}
                              aria-label={`${
                                isExpanded ? 'Recolher' : 'Expandir'
                              } marcos de ${goal.title}`}
                              data-testid={`long-term-goal-expand-${goal.id}`}
                              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progresso de ${goal.title}`}
                        className="w-full h-1.5 bg-track rounded-full overflow-hidden mt-2.5"
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-accent'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {!isExpanded && (
                        <p className="text-[11px] text-ink-subtle mt-1.5 truncate">
                          {nextMilestone
                            ? `Próximo marco: ${nextMilestone}`
                            : totalCount > 0
                            ? 'Todos os marcos concluídos'
                            : 'Nenhum marco definido ainda'}
                        </p>
                      )}

                      {isExpanded && milestones.length > 0 && (
                        <ul
                          data-testid={`long-term-goal-milestones-${goal.id}`}
                          className="mt-3 pt-2.5 border-t border-edge space-y-2"
                        >
                          {milestones.map((ms) => (
                            <li key={ms.id} className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => onToggleMilestone(goal.id, ms.id)}
                                aria-pressed={ms.completed}
                                aria-label={`${
                                  ms.completed ? 'Reabrir' : 'Concluir'
                                } marco ${ms.title}`}
                                data-testid={`long-term-goal-ms-${ms.id}`}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  ms.completed
                                    ? 'bg-accent border-accent text-accent-ink'
                                    : 'border-edge-strong hover:border-accent-text text-transparent hover:text-accent-text'
                                }`}
                              >
                                <Check className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <span
                                className={`text-xs transition-colors ${
                                  ms.completed
                                    ? 'text-ink-subtle line-through'
                                    : 'text-ink-secondary'
                                }`}
                              >
                                {ms.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }
              )}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
