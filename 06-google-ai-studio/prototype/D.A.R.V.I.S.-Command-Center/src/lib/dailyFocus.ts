import type { TaskPriority } from '../types/darvis';

export const DAILY_FOCUS_STORAGE_KEY = 'darvis_daily_focus_v1';

export interface DailyFocusEntry {
  dateKey: string;
  affirmation: string;
  focusTag: string;
  source: 'gemini' | 'local';
  generatedAt: string;
}

export type QuickActionType = 'meeting_note' | 'quick_task' | 'thought';

export interface QuickCaptureDefaults {
  actionType: QuickActionType;
  heading: string;
  titlePlaceholder: string;
  contentPlaceholder: string;
  defaultFolder: string;
  defaultMemoryCategory: 'Projetos & Ideias' | 'Contexto Pessoal';
  defaultTaskCategory: string;
  defaultPriority: TaskPriority;
  defaultDueDate: string;
}

const LOCAL_CURATED_FOCUS: Array<{ affirmation: string; focusTag: string }> = [
  {
    affirmation:
      'Clareza antes de velocidade: escolha a entrega de maior impacto hoje e proteja seu bloco de foco profundo.',
    focusTag: 'Execução Intencional',
  },
  {
    affirmation:
      'Pequenos incrementos consistentes superam planos perfeitos adiados. Conclua uma etapa crítica agora.',
    focusTag: 'Progresso Contínuo',
  },
  {
    affirmation:
      'Cada decisão registrada na memória libera sua mente para resolver problemas novos com serenidade.',
    focusTag: 'Clareza Mental',
  },
  {
    affirmation:
      'Priorize o essencial, delegue ou adie o ruído e feche o dia com menos pendências em aberto.',
    focusTag: 'Foco Essencial',
  },
  {
    affirmation:
      'Sistemas confiáveis transformam disciplina em resultado previsível. Avance um passo concreto de cada vez.',
    focusTag: 'Arquitetura Pessoal',
  },
];

export function toLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDailyFocusFreshForDate(
  entry: DailyFocusEntry | null | undefined,
  dateKey: string
): boolean {
  if (!entry) return false;
  return (
    entry.dateKey === dateKey &&
    typeof entry.affirmation === 'string' &&
    entry.affirmation.trim().length > 0
  );
}

export function getDeterministicLocalFocus(
  dateKey: string,
  userName: string
): DailyFocusEntry {
  const numericSeed = dateKey
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const picked = LOCAL_CURATED_FOCUS[numericSeed % LOCAL_CURATED_FOCUS.length];
  const firstName = userName.trim().split(/\s+/)[0];
  const affirmation = firstName
    ? `${firstName}, ${picked.affirmation.charAt(0).toLowerCase()}${picked.affirmation.slice(1)}`
    : picked.affirmation;

  return {
    dateKey,
    affirmation,
    focusTag: picked.focusTag,
    source: 'local',
    generatedAt: new Date().toISOString(),
  };
}

export function parseDailyFocusPayload(
  rawText: string
): { affirmation: string; focusTag: string } | null {
  const trimmed = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as {
      affirmation?: unknown;
      focusTag?: unknown;
    };
    if (typeof parsed.affirmation === 'string' && parsed.affirmation.trim()) {
      return {
        affirmation: parsed.affirmation.trim().slice(0, 260),
        focusTag:
          typeof parsed.focusTag === 'string' && parsed.focusTag.trim()
            ? parsed.focusTag.trim().slice(0, 48)
            : 'Foco do Dia',
      };
    }
  } catch {
    // Fallback to plain text if the model returned an unformatted sentence
  }

  const singleParagraph = trimmed.replace(/\s+/g, ' ').replace(/^["']|["']$/g, '');
  if (!singleParagraph) return null;

  return {
    affirmation: singleParagraph.slice(0, 260),
    focusTag: 'Foco do Dia',
  };
}

export function buildQuickCaptureDefaults(
  actionType: QuickActionType,
  todayKey: string = toLocalDateKey()
): QuickCaptureDefaults {
  if (actionType === 'meeting_note') {
    return {
      actionType,
      heading: 'Registrar Nota de Reunião',
      titlePlaceholder: 'Ex.: Alinhamento semanal de arquitetura',
      contentPlaceholder: 'Principais decisões, participantes e próximos passos...',
      defaultFolder: '02-Reuniões',
      defaultMemoryCategory: 'Contexto Pessoal',
      defaultTaskCategory: 'Reunião',
      defaultPriority: 'media',
      defaultDueDate: todayKey,
    };
  }

  if (actionType === 'quick_task') {
    return {
      actionType,
      heading: 'Adicionar Tarefa Rápida',
      titlePlaceholder: 'Ex.: Revisar pull request de autenticação',
      contentPlaceholder: '',
      defaultFolder: '00-Inbox',
      defaultMemoryCategory: 'Contexto Pessoal',
      defaultTaskCategory: 'Geral',
      defaultPriority: 'alta',
      defaultDueDate: todayKey,
    };
  }

  return {
    actionType,
    heading: 'Registrar Pensamento',
    titlePlaceholder: 'Ex.: Ideia para resumo automático matinal',
    contentPlaceholder: 'Descreva o insight, hipótese ou contexto para lembrar depois...',
    defaultFolder: '00-Inbox',
    defaultMemoryCategory: 'Projetos & Ideias',
    defaultTaskCategory: 'Geral',
    defaultPriority: 'media',
    defaultDueDate: todayKey,
  };
}
