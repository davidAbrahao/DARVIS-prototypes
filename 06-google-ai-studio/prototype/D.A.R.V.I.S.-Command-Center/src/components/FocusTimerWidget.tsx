import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import {
  calculateTimerProgress,
  FOCUS_MODES,
  formatCountdown,
  getFocusStatusMessage,
  type FocusTimerMode,
  type FocusTimerStatus,
} from '../lib/focusTimer';
import { Skeleton } from './Skeleton';

interface FocusTimerWidgetProps {
  isLoading?: boolean;
  onSessionComplete?: (mode: FocusTimerMode) => void;
}

export function FocusTimerWidget({
  isLoading = false,
  onSessionComplete,
}: FocusTimerWidgetProps) {
  const [mode, setMode] = useState<FocusTimerMode>('pomodoro');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    FOCUS_MODES.pomodoro.durationSeconds
  );
  const [status, setStatus] = useState<FocusTimerStatus>('idle');
  const [completedCount, setCompletedCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const totalSeconds = FOCUS_MODES[mode].durationSeconds;
  const progress = calculateTimerProgress(remainingSeconds, totalSeconds);
  const statusMessage = getFocusStatusMessage(status, mode);

  useEffect(() => {
    if (status !== 'running') return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setStatus('completed');
          if (mode === 'pomodoro') {
            setCompletedCount((c) => c + 1);
          }
          onSessionComplete?.(mode);

          if (
            notificationsEnabled &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            window.Notification.permission === 'granted'
          ) {
            try {
              new window.Notification('D.A.R.V.I.S. · Temporizador de Foco', {
                body: getFocusStatusMessage('completed', mode),
              });
            } catch {
              // Ignore browser notification restrictions inside iframes
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, notificationsEnabled, onSessionComplete, status]);

  const handleSelectMode = (nextMode: FocusTimerMode) => {
    setMode(nextMode);
    setRemainingSeconds(FOCUS_MODES[nextMode].durationSeconds);
    setStatus('idle');
  };

  const handleToggleStartPause = () => {
    if (status === 'running') {
      setStatus('paused');
      return;
    }
    if (status === 'completed' || remainingSeconds <= 0) {
      setRemainingSeconds(totalSeconds);
    }
    setStatus('running');
  };

  const handleReset = () => {
    setStatus('idle');
    setRemainingSeconds(totalSeconds);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        return;
      }
      if (window.Notification.permission !== 'denied') {
        try {
          const perm = await window.Notification.requestPermission();
          setNotificationsEnabled(perm === 'granted');
          return;
        } catch {
          // Ignore iframe permission errors
        }
      }
    }
    setNotificationsEnabled(true);
  };

  return (
    <section
      aria-label="Temporizador de Foco"
      className="rounded-xl bg-surface border border-edge p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Timer className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-ink truncate">
                Temporizador de Foco
              </h3>
              <p className="text-xs text-ink-muted mt-0.5 truncate">
                Sessão Pomodoro com status integrado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleToggleNotifications()}
            aria-pressed={notificationsEnabled}
            aria-label="Alternar notificação de navegador"
            title={
              notificationsEnabled
                ? 'Notificação visual e do navegador ativa'
                : 'Ativar notificação ao concluir'
            }
            className={`p-2 rounded-lg border text-xs transition-colors shrink-0 ${
              notificationsEnabled
                ? 'bg-accent-soft border-accent-soft-border text-accent-text'
                : 'border-edge-strong text-ink-muted hover:bg-hover-surface'
            }`}
          >
            <Bell className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Carregando temporizador de foco"
            data-testid="focus-timer-skeleton"
            className="space-y-4"
          >
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Selector */}
            <div
              role="group"
              aria-label="Modo do temporizador"
              className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-inset border border-edge"
            >
              {(
                [
                  { id: 'pomodoro', short: '25 min' },
                  { id: 'short_break', short: 'Pausa 5m' },
                  { id: 'long_break', short: 'Pausa 15m' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectMode(opt.id)}
                  aria-pressed={mode === opt.id}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    mode === opt.id
                      ? 'bg-surface text-ink border border-edge'
                      : 'text-ink-muted hover:text-ink border border-transparent'
                  }`}
                >
                  {opt.short}
                </button>
              ))}
            </div>

            {/* Countdown Display */}
            <div className="flex items-baseline justify-between gap-4">
              <span
                data-testid="focus-timer-display"
                className="font-mono text-3xl sm:text-4xl font-semibold text-ink tabular-nums tracking-tight"
              >
                {formatCountdown(remainingSeconds)}
              </span>
              <span className="font-mono text-xs text-ink-muted tabular-nums">
                {completedCount}{' '}
                {completedCount === 1 ? 'ciclo hoje' : 'ciclos hoje'}
              </span>
            </div>

            {/* Progress Bar */}
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da sessão de foco"
              className="w-full h-1.5 bg-track rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-testid="focus-timer-toggle"
                onClick={handleToggleStartPause}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink hover:bg-accent-hover text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {status === 'running' ? (
                  <>
                    <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{status === 'paused' ? 'Retomar' : 'Iniciar 25 min'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                data-testid="focus-timer-reset"
                onClick={handleReset}
                aria-label="Reiniciar temporizador"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Status Notification */}
      {!isLoading && (
        <div
          role="status"
          aria-live="polite"
          data-testid="focus-timer-status"
          className={`mt-4 pt-3 border-t border-edge flex items-center gap-2 text-xs ${
            status === 'completed'
              ? 'text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700 font-medium'
              : status === 'running'
              ? 'text-accent-text'
              : 'text-ink-muted'
          }`}
        >
          {status === 'completed' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Timer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}
    </section>
  );
}
