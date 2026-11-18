import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  FileText,
  Lightbulb,
  X,
} from 'lucide-react';
import {
  buildQuickCaptureDefaults,
  toLocalDateKey,
  type QuickActionType,
} from '../lib/dailyFocus';
import type { MemoryCategory, ModuleId, TaskPriority } from '../types/darvis';

interface QuickActionsBarProps {
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
  onNavigate: (module: ModuleId) => void;
}

interface ActionFeedback {
  message: string;
  targetModule: ModuleId;
  targetLabel: string;
}

export function QuickActionsBar({
  onAddTask,
  onAddMemory,
  onSaveNote,
  onNavigate,
}: QuickActionsBarProps) {
  const [activeAction, setActiveAction] = useState<QuickActionType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('alta');
  const [dueDate, setDueDate] = useState(() => toLocalDateKey());
  const [memoryCategory, setMemoryCategory] =
    useState<MemoryCategory>('Projetos & Ideias');
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeAction) {
      titleInputRef.current?.focus();
    }
  }, [activeAction]);

  const handleSelectAction = (actionType: QuickActionType) => {
    if (activeAction === actionType) {
      setActiveAction(null);
      return;
    }
    const defaults = buildQuickCaptureDefaults(actionType);
    setActiveAction(actionType);
    setTitle('');
    setContent('');
    setPriority(defaults.defaultPriority);
    setDueDate(defaults.defaultDueDate);
    setMemoryCategory(defaults.defaultMemoryCategory);
    setFeedback(null);
  };

  const handleClose = () => {
    setActiveAction(null);
    setTitle('');
    setContent('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !activeAction) return;

    const todayKey = toLocalDateKey();

    if (activeAction === 'meeting_note') {
      const body = content.trim()
        ? `# ${trimmedTitle}\n\nData: ${todayKey}\n\n${content.trim()}`
        : `# ${trimmedTitle}\n\nData: ${todayKey}\n\n- Pauta e decisões registradas via Quick Actions.`;
      onSaveNote({
        title: trimmedTitle,
        folder: '02-Reuniões',
        content: body,
        tags: ['reuniao', 'quick-action'],
      });
      setFeedback({
        message: `Nota de reunião "${trimmedTitle}" salva em 02-Reuniões.`,
        targetModule: 'knowledge',
        targetLabel: 'Abrir Base de Conhecimento',
      });
    } else if (activeAction === 'quick_task') {
      onAddTask({
        title: trimmedTitle,
        category: 'Geral',
        priority,
        dueDate: dueDate || todayKey,
      });
      setFeedback({
        message: `Tarefa "${trimmedTitle}" adicionada às pendências.`,
        targetModule: 'management',
        targetLabel: 'Abrir Gestão Pessoal',
      });
    } else if (activeAction === 'thought') {
      onAddMemory({
        title: trimmedTitle,
        content: content.trim() || trimmedTitle,
        category: memoryCategory,
        tags: ['insight', 'quick-action'],
        source: 'Manual',
      });
      setFeedback({
        message: `Pensamento "${trimmedTitle}" registrado na Central de Memória.`,
        targetModule: 'memory',
        targetLabel: 'Abrir Central de Memória',
      });
    }

    setActiveAction(null);
    setTitle('');
    setContent('');
  };

  const defaults = activeAction ? buildQuickCaptureDefaults(activeAction) : null;

  return (
    <section
      aria-label="Quick Actions"
      className="rounded-xl bg-surface border border-edge p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">
            Quick Actions
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Captura rápida em um clique para notas de reunião, tarefas e pensamentos
          </p>
        </div>

        {feedback && !activeAction && (
          <div
            role="status"
            data-testid="quick-action-feedback"
            className="flex flex-wrap items-center gap-2 text-xs text-emerald-500 [[data-theme=minimalist-light]_&]:text-emerald-700"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => onNavigate(feedback.targetModule)}
              className="text-accent-text hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {feedback.targetLabel}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          data-quick-action="meeting_note"
          aria-pressed={activeAction === 'meeting_note'}
          onClick={() => handleSelectAction('meeting_note')}
          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 min-h-[42px] rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeAction === 'meeting_note'
              ? 'bg-accent-soft border-accent-soft-border text-accent-text'
              : 'bg-inset border-edge text-ink-secondary hover:border-edge-strong hover:text-ink'
          }`}
        >
          <FileText className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
          <span>Registrar Nota de Reunião</span>
        </button>

        <button
          type="button"
          data-quick-action="quick_task"
          aria-pressed={activeAction === 'quick_task'}
          onClick={() => handleSelectAction('quick_task')}
          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 min-h-[42px] rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeAction === 'quick_task'
              ? 'bg-accent-soft border-accent-soft-border text-accent-text'
              : 'bg-inset border-edge text-ink-secondary hover:border-edge-strong hover:text-ink'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
          <span>Adicionar Tarefa Rápida</span>
        </button>

        <button
          type="button"
          data-quick-action="thought"
          aria-pressed={activeAction === 'thought'}
          onClick={() => handleSelectAction('thought')}
          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 min-h-[42px] rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeAction === 'thought'
              ? 'bg-accent-soft border-accent-soft-border text-accent-text'
              : 'bg-inset border-edge text-ink-secondary hover:border-edge-strong hover:text-ink'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
          <span>Registrar Pensamento</span>
        </button>
      </div>

      {activeAction && defaults && (
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClose();
            }
          }}
          data-testid="quick-action-form"
          className="mt-4 pt-4 border-t border-edge space-y-3"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-accent-text">{defaults.heading}</p>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar captura rápida"
              className="text-ink-muted hover:text-ink p-1 rounded"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="quick-action-title" className="sr-only">
                Título
              </label>
              <input
                ref={titleInputRef}
                id="quick-action-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={defaults.titlePlaceholder}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3.5 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
            </div>

            {activeAction === 'quick_task' && (
              <>
                <div>
                  <label htmlFor="quick-action-priority" className="sr-only">
                    Prioridade
                  </label>
                  <select
                    id="quick-action-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full md:w-auto bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="alta">Prioridade Alta</option>
                    <option value="media">Prioridade Média</option>
                    <option value="baixa">Prioridade Baixa</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quick-action-date" className="sr-only">
                    Prazo
                  </label>
                  <input
                    id="quick-action-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full md:w-auto bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </>
            )}

            {activeAction === 'thought' && (
              <div>
                <label htmlFor="quick-action-memory-category" className="sr-only">
                  Categoria de Memória
                </label>
                <select
                  id="quick-action-memory-category"
                  value={memoryCategory}
                  onChange={(e) =>
                    setMemoryCategory(e.target.value as MemoryCategory)
                  }
                  className="w-full md:w-auto bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="Projetos & Ideias">Projetos & Ideias</option>
                  <option value="Contexto Pessoal">Contexto Pessoal</option>
                  <option value="Decisões">Decisões</option>
                  <option value="Conhecimento Técnico">Conhecimento Técnico</option>
                  <option value="Preferências">Preferências</option>
                </select>
              </div>
            )}
          </div>

          {activeAction !== 'quick_task' && (
            <div>
              <label htmlFor="quick-action-content" className="sr-only">
                Detalhes
              </label>
              <textarea
                id="quick-action-content"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={defaults.contentPlaceholder}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3.5 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent resize-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface transition-colors whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
