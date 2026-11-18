import { useEffect, useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { formatCountdown } from '../lib/focusTimer';
import type { TrainingRoutine, TrainingSessionLog } from '../types/darvis';
import { MaturityTag } from './MaturityTag';

interface TrainingViewProps {
  routines: TrainingRoutine[];
  history: TrainingSessionLog[];
  onToggleExercise: (routineId: string, exerciseId: string) => void;
  onAddExercise: (
    routineId: string,
    input: { name: string; sets: string; load: string }
  ) => void;
  onResetRoutine: (routineId: string) => void;
  onLogSession: (input: {
    routineId: string;
    routineName: string;
    durationSeconds: number;
    exercisesCompleted: number;
    totalExercises: number;
    notes?: string;
  }) => void;
}

export function TrainingView({
  routines,
  history,
  onToggleExercise,
  onAddExercise,
  onResetRoutine,
  onLogSession,
}: TrainingViewProps) {
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    routines[0]?.id ?? 'tr-upper'
  );
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restStatus, setRestStatus] = useState<'idle' | 'active' | 'done'>('idle');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionSavedMessage, setSessionSavedMessage] = useState<string | null>(null);

  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('3x12');
  const [newExerciseLoad, setNewExerciseLoad] = useState('');

  const activeRoutine =
    routines.find((r) => r.id === selectedRoutineId) ?? routines[0];

  useEffect(() => {
    if (!sessionActive) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (restStatus !== 'active') return;
    const interval = window.setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setRestStatus('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [restStatus]);

  if (!activeRoutine) {
    return null;
  }

  const completedCount = activeRoutine.exercises.filter((ex) => ex.completed).length;
  const totalCount = activeRoutine.exercises.length;
  const completionPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleStartRest = (seconds: number) => {
    setRestRemaining(seconds);
    setRestStatus('active');
  };

  const handleAddExerciseSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    onAddExercise(activeRoutine.id, {
      name: newExerciseName,
      sets: newExerciseSets,
      load: newExerciseLoad,
    });
    setNewExerciseName('');
    setNewExerciseLoad('');
  };

  const handleCompleteSession = () => {
    onLogSession({
      routineId: activeRoutine.id,
      routineName: activeRoutine.name,
      durationSeconds: Math.max(elapsedSeconds, 60),
      exercisesCompleted: completedCount,
      totalExercises: totalCount,
      notes: sessionNotes,
    });
    setSessionActive(false);
    setElapsedSeconds(0);
    setRestStatus('idle');
    setRestRemaining(0);
    setSessionNotes('');
    setSessionSavedMessage(
      `Sessão "${activeRoutine.name}" concluída e registrada no histórico.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Routine Selector */}
      <section className="rounded-xl bg-surface border border-edge p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-accent-text" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-ink">
                Modo Treino
              </h2>
              <MaturityTag
                maturity="simulated"
                labelOverride="Sessão Local · Persistente"
              />
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Controle de séries, cronômetro de sessão ativa, descanso entre séries e histórico físico.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-ink-muted tabular-nums">
            <span>{history.length} sessões registradas</span>
          </div>
        </div>

        {/* Routine Tabs */}
        <div
          role="tablist"
          aria-label="Selecionar rotina de treino"
          className="flex flex-wrap gap-2"
        >
          {routines.map((routine) => {
            const isSelected = routine.id === activeRoutine.id;
            return (
              <button
                key={routine.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedRoutineId(routine.id);
                  setSessionSavedMessage(null);
                }}
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-accent-soft border-accent-soft-border text-accent-text'
                    : 'bg-inset border-edge text-ink-muted hover:text-ink'
                }`}
              >
                {routine.name}
              </button>
            );
          })}
        </div>
      </section>

      {sessionSavedMessage && (
        <div
          role="status"
          data-testid="training-session-saved"
          className="rounded-xl bg-surface border border-edge p-4 flex items-center gap-2.5 text-xs text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{sessionSavedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Active Workout Checklist */}
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-xl bg-surface border border-edge p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  {activeRoutine.name}
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                  {activeRoutine.focus} · Duração estimada {activeRoutine.estimatedMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-accent-text tabular-nums">
                  {completedCount}/{totalCount} exercícios ({completionPct}%)
                </span>
                <button
                  type="button"
                  onClick={() => onResetRoutine(activeRoutine.id)}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Limpar</span>
                </button>
              </div>
            </div>

            <div className="w-full h-1.5 bg-track rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            <ul className="divide-y divide-edge">
              {activeRoutine.exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleExercise(activeRoutine.id, exercise.id)}
                      aria-label={`Marcar exercício ${exercise.name}`}
                      aria-pressed={exercise.completed}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        exercise.completed
                          ? 'bg-accent border-accent text-accent-ink'
                          : 'border-edge-strong text-transparent hover:border-accent-text'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          exercise.completed
                            ? 'line-through text-ink-subtle'
                            : 'text-ink'
                        }`}
                      >
                        {exercise.name}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5 font-mono tabular-nums">
                        {exercise.sets} · {exercise.load}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add Custom Exercise */}
            <form
              onSubmit={handleAddExerciseSubmit}
              className="mt-5 pt-4 border-t border-edge flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Adicionar exercício ao treino..."
                aria-label="Nome do novo exercício"
                className="flex-1 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                value={newExerciseSets}
                onChange={(e) => setNewExerciseSets(e.target.value)}
                placeholder="Séries (ex: 3x12)"
                aria-label="Séries e repetições"
                className="w-full sm:w-24 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs font-mono text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                value={newExerciseLoad}
                onChange={(e) => setNewExerciseLoad(e.target.value)}
                placeholder="Carga"
                aria-label="Carga"
                className="w-full sm:w-24 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs font-mono text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={!newExerciseName.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-45 text-xs font-medium whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Adicionar</span>
              </button>
            </form>
          </section>
        </div>

        {/* Session Controller, Rest Timer & History */}
        <div className="space-y-6">
          <section className="rounded-xl bg-surface border border-edge p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display text-base font-semibold text-ink">
                  Cronômetro da Sessão
                </h3>
                <Clock className="w-4 h-4 text-accent-text" aria-hidden="true" />
              </div>
              <p
                data-testid="training-elapsed-timer"
                className="font-mono text-3xl font-semibold text-ink tabular-nums"
              >
                {formatCountdown(elapsedSeconds)}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                {sessionActive
                  ? 'Treino em andamento'
                  : elapsedSeconds > 0
                  ? 'Sessão pausada'
                  : 'Inicie para cronometrar seu treino'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-testid="training-session-toggle"
                onClick={() => {
                  setSessionActive((prev) => !prev);
                  setSessionSavedMessage(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink hover:bg-accent-hover text-xs font-medium whitespace-nowrap"
              >
                {sessionActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pausar Treino</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{elapsedSeconds > 0 ? 'Retomar Treino' : 'Iniciar Sessão'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Rest Timer */}
            <div className="pt-4 border-t border-edge space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-ink-secondary inline-flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-accent-text" aria-hidden="true" />
                  <span>Descanso entre séries</span>
                </span>
                {restStatus === 'active' && (
                  <span className="font-mono text-accent-text tabular-nums">
                    {restRemaining}s
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[45, 60, 90].map((secs) => (
                  <button
                    key={secs}
                    type="button"
                    onClick={() => handleStartRest(secs)}
                    className="py-1.5 px-2 rounded-lg border border-edge-strong bg-inset text-xs font-mono text-ink-secondary hover:bg-hover-surface tabular-nums"
                  >
                    {secs}s
                  </button>
                ))}
              </div>
              {restStatus !== 'idle' && (
                <p
                  role="status"
                  className={`text-xs ${
                    restStatus === 'done'
                      ? 'text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700 font-medium'
                      : 'text-accent-text'
                  }`}
                >
                  {restStatus === 'done'
                    ? 'Descanso finalizado. Próxima série liberada.'
                    : `Recuperação ativa · ${restRemaining}s restantes`}
                </p>
              )}
            </div>

            {/* Complete & Log Workout */}
            <div className="pt-4 border-t border-edge space-y-3">
              <label htmlFor="training-session-notes" className="sr-only">
                Observações do treino
              </label>
              <input
                id="training-session-notes"
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Observações (cargas, percepção de esforço)..."
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                data-testid="complete-training-session"
                onClick={handleCompleteSession}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-accent-soft-border bg-accent-soft text-accent-text hover:bg-hover-surface text-xs font-medium whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Concluir e Registrar Sessão</span>
              </button>
            </div>
          </section>

          {/* Workout History */}
          <section className="rounded-xl bg-surface border border-edge p-6">
            <h3 className="font-display text-base font-semibold text-ink mb-3">
              Histórico de Treinos
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-ink-muted">
                Nenhuma sessão concluída ainda.
              </p>
            ) : (
              <ul className="divide-y divide-edge">
                {history.slice(0, 5).map((item) => (
                  <li key={item.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink truncate">
                        {item.routineName}
                      </span>
                      <span className="font-mono text-ink-muted tabular-nums shrink-0">
                        {Math.round(item.durationSeconds / 60)} min
                      </span>
                    </div>
                    <p className="text-ink-muted mt-0.5 tabular-nums">
                      {item.exercisesCompleted}/{item.totalExercises} exercícios ·{' '}
                      {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                    </p>
                    {item.notes && (
                      <p className="text-ink-subtle mt-1">{item.notes}</p>
                    )}
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
