import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { computeTaskInsights } from '../lib/darvisLogic';
import type { ModuleId, TaskItem } from '../types/darvis';
import { Skeleton } from './Skeleton';

interface TaskInsightsWidgetProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  onNavigate: (module: ModuleId) => void;
}

export function TaskInsightsWidget({
  tasks,
  isLoading = false,
  onNavigate,
}: TaskInsightsWidgetProps) {
  const insights = computeTaskInsights(tasks);

  return (
    <section
      aria-label="Task Insights"
      className="rounded-xl bg-surface border border-edge p-6"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">
            Task Insights
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Taxa de conclusão e prazos próximos
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('management')}
          className="text-xs font-medium text-accent-text hover:underline whitespace-nowrap shrink-0"
        >
          Gerenciar
        </button>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando insights de tarefas"
          data-testid="task-insights-skeleton"
          className="space-y-4"
        >
          <span className="sr-only">Carregando insights de tarefas...</span>
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-52" />
          <div className="pt-3 border-t border-edge space-y-3">
            {[0, 1].map((idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="h-3.5 w-14 shrink-0" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Completion Rate Block */}
          <div>
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <span
                data-testid="task-completion-rate"
                className="font-display text-2xl font-semibold text-ink tabular-nums"
              >
                {insights.completionRate}%
              </span>
              <span className="font-mono text-xs text-ink-muted tabular-nums">
                {insights.completedTasks}/{insights.totalTasks} concluídas
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={insights.completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Taxa de conclusão de tarefas"
              className="w-full h-1.5 bg-track rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${insights.completionRate}%` }}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted tabular-nums">
              <span>
                {insights.inProgressTasks} em andamento · {insights.pendingTasks} pendentes
              </span>
              {insights.overdueCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {insights.overdueCount}{' '}
                    {insights.overdueCount === 1 ? 'atrasada' : 'atrasadas'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-accent-text">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{insights.dueSoonCount} nos próximos 7 dias</span>
                </span>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines List */}
          <div className="pt-4 border-t border-edge">
            <h4 className="text-xs font-medium text-ink-secondary mb-3">
              Prazos próximos
            </h4>

            {insights.upcomingDeadlines.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-ink-muted py-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                <span>Todas as tarefas concluídas ou sem prazo definido.</span>
              </div>
            ) : (
              <ul className="divide-y divide-edge">
                {insights.upcomingDeadlines.map((item) => {
                  const isOverdue = item.daysRemaining < 0;
                  const isImmediate = item.daysRemaining >= 0 && item.daysRemaining <= 2;

                  return (
                    <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-ink truncate">
                          {item.title}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] tabular-nums shrink-0 ${
                            isOverdue
                              ? 'text-red-500'
                              : isImmediate
                              ? 'text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700'
                              : 'text-accent-text'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          ) : (
                            <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>{item.urgencyLabel}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5 tabular-nums">
                        Prioridade {item.priority} · Prazo{' '}
                        <span className="font-mono text-ink-secondary">{item.dueDate}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
