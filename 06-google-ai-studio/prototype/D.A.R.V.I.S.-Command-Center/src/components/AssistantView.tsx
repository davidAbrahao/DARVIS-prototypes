import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import type { ChatMessage, SystemSettings } from '../types/darvis';
import { MarkdownText } from './MarkdownText';
import { MaturityTag } from './MaturityTag';

interface AssistantViewProps {
  messages: ChatMessage[];
  settings: SystemSettings;
  aiConfigured: boolean | null;
  aiThinking: boolean;
  onSendMessage: (text: string) => void;
  onResolveAction: (
    messageId: string,
    actionId: string,
    decision: 'approved' | 'rejected'
  ) => void;
  onUpdateSettings: (patch: Partial<SystemSettings>) => void;
  onClearChat: () => void;
}

export function AssistantView({
  messages,
  settings,
  aiConfigured,
  aiThinking,
  onSendMessage,
  onResolveAction,
  onUpdateSettings,
  onClearChat,
}: AssistantViewProps) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, aiThinking]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || aiThinking) return;
    setDraft('');
    onSendMessage(trimmed);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main Conversational Thread */}
      <section className="xl:col-span-3 flex flex-col rounded-xl bg-surface border border-edge min-h-[600px] max-h-[calc(100vh-11rem)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-edge flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-semibold text-ink">
                Assistente Contextual D.A.R.V.I.S.
              </h2>
              <MaturityTag
                maturity={aiConfigured ? 'implemented' : 'simulated'}
                labelOverride={
                  aiConfigured ? 'Gemini Conectado' : 'Chave Gemini Ausente'
                }
              />
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Modelo ativo: Google Gemini (gemini-4-hydrogen) · Memória persistente separada do modelo
            </p>
          </div>
          <button
            type="button"
            onClick={onClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nova Sessão</span>
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isError = msg.role === 'error';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isError
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 [[data-theme=minimalist-light]_&]:text-red-600'
                        : 'bg-accent-soft border-accent-soft-border text-accent-text'
                    }`}
                  >
                    {isError ? (
                      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Bot className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-accent-soft border border-accent-soft-border text-ink'
                      : isError
                      ? 'bg-red-500/10 border border-red-500/35 text-red-200 [[data-theme=minimalist-light]_&]:text-red-800'
                      : 'bg-inset border border-edge text-ink-secondary'
                  }`}
                >
                  {isUser || isError ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <MarkdownText content={msg.content} />
                  )}

                  {/* Proposed Human-in-the-Loop Actions */}
                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-edge space-y-2.5">
                      <p className="text-xs font-medium text-accent-text flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Ação estruturada aguardando aprovação humana</span>
                      </p>
                      {msg.proposedActions.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-lg bg-surface border border-edge-strong p-3 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-ink">
                              {act.label}
                            </span>
                            <span className="text-ink-muted">
                              {act.type === 'create_task'
                                ? 'Nova Tarefa'
                                : act.type === 'create_memory'
                                ? 'Nova Memória'
                                : 'Nova Nota'}
                            </span>
                          </div>
                          <p className="text-ink-secondary">{act.payload.title}</p>
                          {act.payload.content && (
                            <p className="text-ink-muted">{act.payload.content}</p>
                          )}

                          {act.status === 'pending' ? (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onResolveAction(msg.id, act.id, 'approved')
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Aprovar e Executar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onResolveAction(msg.id, act.id, 'rejected')
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-edge-strong text-ink-secondary hover:bg-hover-surface transition-colors"
                              >
                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Recusar</span>
                              </button>
                            </div>
                          ) : (
                            <p
                              className={`font-medium ${
                                act.status === 'approved'
                                  ? 'text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700'
                                  : 'text-ink-muted'
                              }`}
                            >
                              {act.status === 'approved'
                                ? 'Aprovado e gravado no sistema.'
                                : 'Recusado pelo usuário.'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-subtle tabular-nums">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.model && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{msg.model}</span>
                      </>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-inset border border-edge-strong flex items-center justify-center text-ink-secondary shrink-0">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}

          {aiThinking && (
            <div className="flex items-center gap-3 text-xs text-accent-text">
              <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-soft-border flex items-center justify-center">
                <Bot className="w-4 h-4" aria-hidden="true" />
              </div>
              <span>Consultando provedor Gemini com contexto de memória...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-edge bg-inset rounded-b-xl"
        >
          <label htmlFor="assistant-chat-input" className="sr-only">
            Mensagem para o Assistente D.A.R.V.I.S.
          </label>
          <div className="flex gap-3">
            <input
              id="assistant-chat-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Digite sua solicitação, pergunta técnica ou comando para o D.A.R.V.I.S..."
              className="flex-1 bg-canvas border border-edge-strong rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!draft.trim() || aiThinking}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-ink font-medium text-sm hover:bg-accent-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Enviar</span>
            </button>
          </div>
        </form>
      </section>

      {/* Right Context & Provider Abstraction Panel */}
      <aside className="space-y-6">
        <div className="rounded-xl bg-surface border border-edge p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold text-ink">
            Camada de Abstração de IA
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label
                htmlFor="ai-provider-select"
                className="block text-ink-muted mb-1.5"
              >
                Provedor Ativo
              </label>
              <select
                id="ai-provider-select"
                value={settings.activeProvider}
                onChange={(e) =>
                  onUpdateSettings({
                    activeProvider: e.target.value as SystemSettings['activeProvider'],
                  })
                }
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                <option value="gemini">Google Gemini · Ativo</option>
                <option value="openai_planned" disabled>
                  OpenAI · Planejado
                </option>
                <option value="anthropic_planned" disabled>
                  Anthropic Claude · Planejado
                </option>
                <option value="local_planned" disabled>
                  Local LLM · Planejado
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ai-thinking-select"
                className="block text-ink-muted mb-1.5"
              >
                Profundidade de Raciocínio
              </label>
              <select
                id="ai-thinking-select"
                value={settings.thinkingLevel}
                onChange={(e) =>
                  onUpdateSettings({
                    thinkingLevel: e.target.value as SystemSettings['thinkingLevel'],
                  })
                }
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                <option value="LOW">Rápido (LOW)</option>
                <option value="MEDIUM">Equilibrado (MEDIUM)</option>
                <option value="HIGH">Profundo (HIGH)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ai-persona-select"
                className="block text-ink-muted mb-1.5"
              >
                Perfil de Resposta
              </label>
              <select
                id="ai-persona-select"
                value={settings.assistantPersona}
                onChange={(e) =>
                  onUpdateSettings({
                    assistantPersona: e.target.value as SystemSettings['assistantPersona'],
                  })
                }
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                <option value="estrategico">Estratégico</option>
                <option value="analitico">Analítico Técnico</option>
                <option value="conciso">Conciso / Direto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface border border-edge p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold text-ink">
            Contexto & Governança
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.injectMemoryContext}
                onChange={(e) =>
                  onUpdateSettings({ injectMemoryContext: e.target.checked })
                }
                className="mt-0.5 rounded border-edge-strong bg-inset accent-accent"
              />
              <span>
                <span className="block text-ink-secondary font-medium">
                  Injetar Memórias e Projetos
                </span>
                <span className="text-ink-muted">
                  Fornece contexto persistente a cada solicitação sem depender do histórico do modelo.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireHumanApproval}
                onChange={(e) =>
                  onUpdateSettings({ requireHumanApproval: e.target.checked })
                }
                className="mt-0.5 rounded border-edge-strong bg-inset accent-accent"
              />
              <span>
                <span className="block text-ink-secondary font-medium">
                  Aprovação Humana para Ações
                </span>
                <span className="text-ink-muted">
                  Exige confirmação antes de gravar tarefas, memórias ou notas sugeridas pela IA.
                </span>
              </span>
            </label>
          </div>
        </div>
      </aside>
    </div>
  );
}
