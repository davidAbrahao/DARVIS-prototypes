export type FocusTimerMode = 'pomodoro' | 'short_break' | 'long_break';
export type FocusTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface FocusModeConfig {
  mode: FocusTimerMode;
  label: string;
  durationSeconds: number;
}

export const FOCUS_MODES: Record<FocusTimerMode, FocusModeConfig> = {
  pomodoro: {
    mode: 'pomodoro',
    label: 'Pomodoro (25 min)',
    durationSeconds: 25 * 60,
  },
  short_break: {
    mode: 'short_break',
    label: 'Pausa Curta (5 min)',
    durationSeconds: 5 * 60,
  },
  long_break: {
    mode: 'long_break',
    label: 'Pausa Longa (15 min)',
    durationSeconds: 15 * 60,
  },
};

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function calculateTimerProgress(
  remainingSeconds: number,
  totalSeconds: number
): number {
  if (totalSeconds <= 0) return 0;
  const elapsed = Math.max(0, totalSeconds - Math.max(0, remainingSeconds));
  return Math.min(100, Math.round((elapsed / totalSeconds) * 100));
}

export function getFocusStatusMessage(
  status: FocusTimerStatus,
  mode: FocusTimerMode
): string {
  const modeLabel = FOCUS_MODES[mode].label;
  if (status === 'running') {
    return mode === 'pomodoro'
      ? 'Sessão de foco ativa · Mantenha concentração total'
      : 'Pausa em andamento · Descanse a mente';
  }
  if (status === 'paused') {
    return `Pausado · ${modeLabel}`;
  }
  if (status === 'completed') {
    return mode === 'pomodoro'
      ? 'Pomodoro de 25 min concluído! Hora de fazer uma pausa.'
      : 'Pausa concluída! Pronto para o próximo ciclo de foco.';
  }
  return `Pronto para iniciar · ${modeLabel}`;
}
