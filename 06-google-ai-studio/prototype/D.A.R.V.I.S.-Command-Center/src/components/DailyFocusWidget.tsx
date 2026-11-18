import { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, RefreshCw } from 'lucide-react';
import {
  DAILY_FOCUS_STORAGE_KEY,
  getDeterministicLocalFocus,
  isDailyFocusFreshForDate,
  toLocalDateKey,
  type DailyFocusEntry,
} from '../lib/dailyFocus';
import { MaturityTag } from './MaturityTag';
import { Skeleton } from './Skeleton';

interface DailyFocusWidgetProps {
  userName: string;
  pendingTasksCount: number;
  activeProjectsCount: number;
  aiConfigured: boolean | null;
  isLoading?: boolean;
}

function readCachedDailyFocus(): DailyFocusEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DAILY_FOCUS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyFocusEntry;
  } catch {
    return null;
  }
}

function writeCachedDailyFocus(entry: DailyFocusEntry) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DAILY_FOCUS_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

export function DailyFocusWidget({
  userName,
  pendingTasksCount,
  activeProjectsCount,
  aiConfigured,
  isLoading = false,
}: DailyFocusWidgetProps) {
  const todayKey = toLocalDateKey();
  const [entry, setEntry] = useState<DailyFocusEntry | null>(() => {
    const cached = readCachedDailyFocus();
    return isDailyFocusFreshForDate(cached, todayKey) ? cached : null;
  });
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetchedKeyRef = useRef<string | null>(null);

  const applyLocalFocus = useCallback(() => {
    const localEntry = getDeterministicLocalFocus(todayKey, userName);
    writeCachedDailyFocus(localEntry);
    setEntry(localEntry);
    setError(null);
  }, [todayKey, userName]);

  const fetchFromGemini = useCallback(
    async (fallbackToLocalOnFailure = false) => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch('/api/ai/daily-focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            userName,
            pendingTasksCount,
            activeProjectsCount,
            dateKey: todayKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const rawErr = typeof data?.error === 'string' ? data.error : '';
          throw new Error(
            rawErr && !rawErr.trim().startsWith('{')
              ? rawErr
              : 'Não foi possível gerar o foco diário pelo Gemini no momento.'
          );
        }

        const freshEntry: DailyFocusEntry = {
          dateKey: data.dateKey || todayKey,
          affirmation: data.affirmation,
          focusTag: data.focusTag || 'Foco do Dia',
          source: 'gemini',
          generatedAt: new Date().toISOString(),
        };
        writeCachedDailyFocus(freshEntry);
        setEntry(freshEntry);
      } catch (err) {
        if (fallbackToLocalOnFailure) {
          const localEntry = getDeterministicLocalFocus(todayKey, userName);
          writeCachedDailyFocus(localEntry);
          setEntry(localEntry);
          setError(null);
        } else {
          const rawMsg =
            err instanceof Error
              ? err.message
              : 'Erro ao consultar o provedor Gemini.';
          const isTimeout =
            rawMsg.toLowerCase().includes('timeout') ||
            rawMsg.toLowerCase().includes('abort') ||
            rawMsg.includes('504');
          setError(
            isTimeout
              ? 'Tempo limite excedido ao consultar o Gemini.'
              : rawMsg.trim().startsWith('{')
              ? 'Não foi possível gerar o foco diário pelo Gemini no momento.'
              : rawMsg
          );
        }
      } finally {
        setFetching(false);
      }
    },
    [activeProjectsCount, pendingTasksCount, todayKey, userName]
  );

  useEffect(() => {
    if (isLoading || aiConfigured === null) return;
    if (isDailyFocusFreshForDate(entry, todayKey)) return;
    if (autoFetchedKeyRef.current === todayKey) return;

    autoFetchedKeyRef.current = todayKey;

    if (aiConfigured) {
      void fetchFromGemini(true);
    } else {
      applyLocalFocus();
    }
  }, [aiConfigured, applyLocalFocus, entry, fetchFromGemini, isLoading, todayKey]);

  const handleRefresh = () => {
    if (aiConfigured) {
      void fetchFromGemini(false);
    } else {
      applyLocalFocus();
    }
  };

  const showSkeleton = isLoading || (fetching && !entry) || (!entry && !error);

  return (
    <section
      aria-label="Daily Focus"
      data-testid="daily-focus-widget"
      className="rounded-xl bg-surface border border-edge p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Compass className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-base font-semibold text-ink">
                  Daily Focus
                </h3>
                {entry && (
                  <MaturityTag
                    maturity={entry.source === 'gemini' ? 'implemented' : 'simulated'}
                    labelOverride={
                      entry.source === 'gemini' ? 'Gemini IA' : 'Curadoria Local'
                    }
                  />
                )}
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Diretriz diária orientada à produtividade
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={fetching || isLoading}
            aria-label="Gerar novo foco diário"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{fetching ? 'Gerando...' : 'Atualizar'}</span>
          </button>
        </div>

        {showSkeleton ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Carregando foco diário"
            data-testid="daily-focus-skeleton"
            className="space-y-2.5"
          >
            <span className="sr-only">Carregando foco diário...</span>
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-44 mt-1" />
          </div>
        ) : error && !entry ? (
          <div role="alert" className="space-y-3">
            <p className="text-xs text-red-400 [[data-theme=minimalist-light]_&]:text-red-600">
              {error}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void fetchFromGemini(false)}
                className="px-3 py-1.5 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={applyLocalFocus}
                className="px-3 py-1.5 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface transition-colors whitespace-nowrap shrink-0"
              >
                Usar curadoria local
              </button>
            </div>
          </div>
        ) : entry ? (
          <p
            data-testid="daily-focus-affirmation"
            className="font-display text-base sm:text-lg font-medium text-ink leading-relaxed text-balance"
          >
            {entry.affirmation}
          </p>
        ) : null}
      </div>

      {!showSkeleton && entry && (
        <div className="mt-4 pt-3 border-t border-edge flex flex-wrap items-center gap-2 text-xs text-ink-muted tabular-nums">
          <span className="text-accent-text">{entry.focusTag}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{entry.dateKey}</span>
          {error && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-red-400 [[data-theme=minimalist-light]_&]:text-red-600">
                {error}
              </span>
            </>
          )}
        </div>
      )}
    </section>
  );
}
