import { useState, type FormEvent } from 'react';
import { Check, Flame, Plus, Settings2, Trash2, X } from 'lucide-react';
import { computeHabitsSummary } from '../lib/dailyHabits';
import type { DailyHabit } from '../types/darvis';
import { Skeleton } from './Skeleton';

interface DailyHabitsWidgetProps {
  habits: DailyHabit[];
  isLoading?: boolean;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (input: { title: string; category: string; targetLabel: string }) => void;
  onDeleteHabit: (habitId: string) => void;
}

export function DailyHabitsWidget({
  habits,
  isLoading = false,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
}: DailyHabitsWidgetProps) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [title, setTitle] = useState('');
  const [targetLabel, setTargetLabel] = useState('');
  const [category, setCategory] = useState('Saúde');

  const summary = computeHabitsSummary(habits);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddHabit({
      title: title.trim(),
      category: category.trim() || 'Rotina',
      targetLabel: targetLabel.trim() || 'Diário',
    });
    setTitle('');
    setTargetLabel('');
    setAdding(false);
  };

  return (
    <section
      aria-label="Daily Habits"
      data-testid="daily-habits-widget"
      className="rounded-xl bg-surface border border-edge p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">
            Daily Habits
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Rotinas diárias recorrentes e sequência de dias
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {summary.items.length > 0 && (
            <button
              type="button"
              onClick={() => setManaging((prev) => !prev)}
              disabled={isLoading}
              aria-pressed={managing}
              aria-label={managing ? 'Concluir edição de hábitos' : 'Gerenciar hábitos'}
              data-testid="daily-habits-manage-toggle"
              className={`inline-flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 disabled:opacity-45 ${
                managing ? 'text-accent-text' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{managing ? 'Concluir' : 'Editar'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setAdding((prev) => !prev)}
            disabled={isLoading}
            data-testid="daily-habits-add-toggle"
            aria-expanded={adding}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline whitespace-nowrap shrink-0 disabled:opacity-45"
          >
            {adding ? (
              <>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Fechar</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Novo hábito</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando hábitos diários"
          data-testid="daily-habits-skeleton"
          className="space-y-4"
        >
          <span className="sr-only">Carregando hábitos diários...</span>
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="pt-2 divide-y divide-edge">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-5 h-5 rounded shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-12 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today's completion summary + top streak */}
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div className="flex items-baseline gap-2">
                <span
                  data-testid="daily-habits-progress"
                  className="font-display text-xl font-semibold text-ink tabular-nums"
                >
                  {summary.completedTodayCount}/{summary.totalHabits}
                </span>
                <span className="text-xs text-ink-muted">concluídos hoje</span>
              </div>
              <span
                data-testid="daily-habits-top-streak"
                className="inline-flex items-center gap-1 font-mono text-xs text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700 tabular-nums shrink-0"
              >
                <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Melhor sequência: {summary.topStreak}d</span>
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={summary.completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso diário de hábitos"
              className="w-full h-1.5 bg-track rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
          </div>

          {adding && (
            <form
              onSubmit={handleSubmit}
              data-testid="daily-habits-add-form"
              className="pt-3 border-t border-edge space-y-2.5"
            >
              <div>
                <label htmlFor="new-habit-title" className="sr-only">
                  Nome do hábito
                </label>
                <input
                  id="new-habit-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Meditação, Alongamento, Inglês..."
                  className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="new-habit-target" className="sr-only">
                    Meta diária
                  </label>
                  <input
                    id="new-habit-target"
                    type="text"
                    value={targetLabel}
                    onChange={(e) => setTargetLabel(e.target.value)}
                    placeholder="Meta (ex.: 15 min)"
                    className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label htmlFor="new-habit-category" className="sr-only">
                    Categoria
                  </label>
                  <select
                    id="new-habit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="Saúde">Saúde</option>
                    <option value="Conhecimento">Conhecimento</option>
                    <option value="Treino">Treino</option>
                    <option value="Produtividade">Produtividade</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  Adicionar hábito
                </button>
              </div>
            </form>
          )}

          {/* Habit Rows */}
          {summary.items.length === 0 ? (
            <div className="pt-3 border-t border-edge text-xs text-ink-muted flex items-center justify-between gap-3">
              <span>Nenhum hábito recorrente configurado.</span>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-accent-text font-medium hover:underline whitespace-nowrap shrink-0"
              >
                Adicionar primeiro
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-edge">
              <div className="flex items-center justify-between text-[10px] text-ink-subtle pb-1.5">
                <span>Hábito & meta</span>
                <span className="font-mono">Últimos 7d · Sequência</span>
              </div>
              <ul data-testid="daily-habits-list" className="divide-y divide-edge">
                {summary.items.map(({ habit, completedToday, streak, weekHistory }) => (
                  <li
                    key={habit.id}
                    className="py-2.5 flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleHabit(habit.id)}
                        aria-pressed={completedToday}
                        aria-label={`${
                          completedToday ? 'Desmarcar' : 'Concluir'
                        } hábito ${habit.title}`}
                        data-testid={`daily-habit-toggle-${habit.id}`}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          completedToday
                            ? 'bg-accent border-accent text-accent-ink'
                            : 'border-edge-strong hover:border-accent-text text-transparent hover:text-accent-text'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium truncate transition-colors ${
                            completedToday
                              ? 'text-ink-muted line-through'
                              : 'text-ink'
                          }`}
                        >
                          {habit.title}
                        </p>
                        <p className="text-[11px] text-ink-subtle truncate tabular-nums">
                          {habit.category} · {habit.targetLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* 7-day visual streak squares */}
                      <div
                        className="flex items-center gap-1"
                        aria-label={`Histórico dos últimos 7 dias para ${habit.title}: ${streak} dias em sequência`}
                      >
                        {weekHistory.map((done, idx) => {
                          const slot = summary.daySlots[idx];
                          return (
                            <span
                              key={slot.dateKey}
                              title={`${slot.dateKey}${done ? ' · Concluído' : ' · Pendente'}`}
                              className={`w-2 h-2 rounded-[2px] transition-colors ${
                                done
                                  ? 'bg-accent'
                                  : slot.isToday
                                  ? 'bg-track ring-1 ring-edge-strong'
                                  : 'bg-track'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Numeric streak indicator */}
                      <span
                        data-testid={`daily-habit-streak-${habit.id}`}
                        className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums justify-end ${
                          streak > 0
                            ? 'text-amber-500 [[data-theme=minimalist-light]_&]:text-amber-700 font-medium'
                            : 'text-ink-subtle'
                        }`}
                      >
                        <Flame className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>{streak}d</span>
                      </span>

                      {managing && (
                        <button
                          type="button"
                          onClick={() => onDeleteHabit(habit.id)}
                          aria-label={`Remover hábito ${habit.title}`}
                          className="text-ink-subtle hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
