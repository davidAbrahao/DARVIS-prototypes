import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Flag,
  FolderKanban,
} from 'lucide-react';
import { computeDailyDigest, formatDailyDigestText } from '../lib/dailyDigest';
import type {
  CommitmentItem,
  ModuleId,
  ProjectItem,
  TaskItem,
} from '../types/darvis';
import { Skeleton } from './Skeleton';

interface DailyDigestWidgetProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  commitments: CommitmentItem[];
  userName: string;
  isLoading?: boolean;
  onNavigate: (module: ModuleId) => void;
}

export function DailyDigestWidget({
  tasks,
  projects,
  commitments,
  userName,
  isLoading = false,
  onNavigate,
}: DailyDigestWidgetProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'unavailable'>('idle');
  const timerRef = useRef<number | null>(null);

  const digest = computeDailyDigest({
    tasks,
    projects,
    commitments,
    userName,
  });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopyDigest = async () => {
    const plainText = formatDailyDigestText(digest);
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainText);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = plainText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    setCopyStatus(copied ? 'copied' : 'unavailable');
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setCopyStatus('idle');
    }, 2600);
  };

  return (
    <section
      aria-label="Daily Digest"
      data-testid="daily-digest-widget"
      className="rounded-xl bg-surface border border-edge p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-edge">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="font-display text-base font-semibold text-ink">
              Daily Digest
            </h3>
            <span className="font-mono text-xs text-ink-subtle tabular-nums">
              · {digest.dateLabel}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-72 max-w-full mt-2" />
          ) : (
            <p
              data-testid="daily-digest-summary"
              className="text-xs text-ink-muted mt-1 leading-relaxed"
            >
              {digest.summaryHeadline}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {copyStatus !== 'idle' && (
            <span
              role="status"
              data-testid="daily-digest-copy-status"
              className="text-xs font-medium text-emerald-500 [[data-theme=minimalist-light]_&]:text-emerald-700 whitespace-nowrap"
            >
              {copyStatus === 'copied' ? 'Resumo copiado' : 'Cópia indisponível'}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyDigest}
            disabled={isLoading}
            data-testid="daily-digest-copy"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-inset border border-edge-strong text-xs font-medium text-ink-secondary hover:text-ink hover:border-accent-soft-border disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            {copyStatus === 'copied' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-accent-text shrink-0" aria-hidden="true" />
            )}
            <span>{copyStatus === 'copied' ? 'Copiado' : 'Copiar resumo'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando Daily Digest"
          data-testid="daily-digest-skeleton"
          className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <span className="sr-only">Gerando Daily Digest...</span>
          {[0, 1, 2].map((col) => (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              <Skeleton className="h-6 w-16" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-5 grid grid-cols-1 md:grid-cols-3 divide-y divide-edge md:divide-y-0 md:divide-x">
          {/* Section 1: Completed Tasks */}
          <div className="pb-5 md:pb-0 md:pr-5 flex flex-col justify-between gap-4 min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-emerald-500 [[data-theme=minimalist-light]_&]:text-emerald-700 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Tarefas Concluídas</span>
                </span>
                <span
                  data-testid="daily-digest-completed-count"
                  className="font-mono text-xs text-ink-muted tabular-nums shrink-0"
                >
                  {digest.completedTasks.count}/{digest.completedTasks.total}
                </span>
              </div>

              {digest.completedTasks.items.length === 0 ? (
                <p className="text-xs text-ink-muted leading-relaxed py-1">
                  Nenhuma tarefa concluída hoje até o momento.
                </p>
              ) : (
                <ul
                  data-testid="daily-digest-completed-list"
                  className="space-y-2 mt-2.5"
                >
                  {digest.completedTasks.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 min-w-0">
                      <Check
                        className="w-3.5 h-3.5 mt-0.5 text-emerald-500 [[data-theme=minimalist-light]_&]:text-emerald-700 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-ink truncate">{item.title}</p>
                        <p className="text-[11px] text-ink-subtle truncate">{item.category}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('management')}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline w-fit whitespace-nowrap"
            >
              <span>Ver tarefas</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>

          {/* Section 2: Active Project Milestones */}
          <div className="py-5 md:py-0 md:px-5 flex flex-col justify-between gap-4 min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                  <FolderKanban className="w-3.5 h-3.5 text-accent-text shrink-0" aria-hidden="true" />
                  <span>Marcos Ativos</span>
                </span>
                <span
                  data-testid="daily-digest-milestones-count"
                  className="font-mono text-xs text-ink-muted tabular-nums shrink-0"
                >
                  {digest.activeMilestones.completedMilestones}/
                  {digest.activeMilestones.totalMilestones}
                </span>
              </div>

              {digest.activeMilestones.items.length === 0 ? (
                <p className="text-xs text-ink-muted leading-relaxed py-1">
                  Nenhum projeto ativo com marcos registrados.
                </p>
              ) : (
                <ul
                  data-testid="daily-digest-milestones-list"
                  className="space-y-3 mt-2.5"
                >
                  {digest.activeMilestones.items.map((project) => (
                    <li key={project.projectId} className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-ink truncate">
                          {project.projectName}
                        </p>
                        <span className="font-mono text-[11px] text-accent-text tabular-nums shrink-0">
                          {project.completedCount}/{project.totalCount}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={project.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progresso dos marcos de ${project.projectName}`}
                        className="w-full h-1 bg-track rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${project.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                        {project.nextMilestone
                          ? `Próximo: ${project.nextMilestone}`
                          : 'Todos os marcos concluídos'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline w-fit whitespace-nowrap"
            >
              <span>Abrir projetos</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>

          {/* Section 3: Upcoming Priorities for the Day */}
          <div className="pt-5 md:pt-0 md:pl-5 flex flex-col justify-between gap-4 min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                  <Flag
                    className="w-3.5 h-3.5 text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Prioridades</span>
                </span>
                <span
                  data-testid="daily-digest-priorities-count"
                  className="font-mono text-xs text-ink-muted tabular-nums shrink-0"
                >
                  {digest.upcomingPriorities.count} em aberto
                </span>
              </div>

              {digest.upcomingPriorities.items.length === 0 ? (
                <p className="text-xs text-ink-muted leading-relaxed py-1">
                  Sem tarefas ou compromissos pendentes no radar.
                </p>
              ) : (
                <ul
                  data-testid="daily-digest-priorities-list"
                  className="space-y-2.5 mt-2.5"
                >
                  {digest.upcomingPriorities.items.map((priority) => (
                    <li key={priority.id} className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-ink truncate">
                          {priority.title}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] tabular-nums shrink-0 ${
                            priority.isUrgent
                              ? 'text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700'
                              : 'text-ink-muted'
                          }`}
                        >
                          {priority.kind === 'commitment' && (
                            <CalendarClock className="w-3 h-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>{priority.scheduleLabel}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-subtle truncate mt-0.5">
                        {priority.metaLabel}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('management')}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline w-fit whitespace-nowrap"
            >
              <span>Gerenciar agenda</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
