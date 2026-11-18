"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";

import { ApiError } from "../lib/auth-api";
import { useAuth } from "./auth-provider";

type AssistantStatus = {
  state: "disabled" | "missing_credentials" | "configured";
  provider: string | null;
  model: string | null;
  configured: boolean;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ContextSourceType = "memory" | "project" | "task";

type ContextSourceRef = {
  source_type: ContextSourceType;
  source_id: number;
};

type ContextOption = ContextSourceRef & {
  title: string;
  description: string;
};

type ContextPreview = {
  items: Array<{
    source_type: ContextSourceType;
    source_id: number;
    title: string;
    fields: Record<string, unknown>;
  }>;
  context_text: string;
  character_count: number;
  context_hash: string;
};

type AssistantMessage = {
  id: number;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  context_items?: ContextSourceRef[];
  context_hash?: string | null;
  provider: string | null;
  model: string | null;
  created_at: string;
};

type PendingRequest = {
  content: string;
  fingerprint: string;
  requestId: string;
};

type MemorySource = {
  id: number;
  title: string;
  category: string;
  content: string;
  is_archived: boolean;
};

type ProjectSource = {
  id: number;
  name: string;
  description: string | null;
  status: string;
};

type TaskSource = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
};

const contextTypeLabel: Record<ContextSourceType, string> = {
  memory: "Memória",
  project: "Projeto",
  task: "Tarefa",
};

function contextSummary(items: ContextSourceRef[] | undefined): string {
  if (!items?.length) return "";
  const types = [...new Set(items.map((item) => contextTypeLabel[item.source_type]))];
  return items.length + (items.length === 1 ? " fonte · " : " fontes · ") + types.join(", ");
}

const statusCopy: Record<AssistantStatus["state"], { title: string; detail: string }> = {
  disabled: {
    title: "Assistente desativado",
    detail: "O provedor ainda não foi habilitado no servidor.",
  },
  missing_credentials: {
    title: "Credencial pendente",
    detail: "O provedor está selecionado, mas a chave não foi configurada no servidor.",
  },
  configured: {
    title: "Provedor configurado",
    detail:
      "Ao enviar, o histórico desta conversa e a mensagem vão ao Google Gemini. Memórias, projetos e tarefas só entram quando você os seleciona, confere a prévia e confirma aquele envio.",

  },
};

function formatConversationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AssistantWorkspace() {
  const { apiRequest } = useAuth();
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [renamingConversation, setRenamingConversation] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [contextOptions, setContextOptions] = useState<ContextOption[]>([]);
  const [contextSelection, setContextSelection] = useState<ContextSourceRef[]>([]);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextPreviewLoading, setContextPreviewLoading] = useState(false);
  const [contextPreview, setContextPreview] = useState<ContextPreview | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const pendingRequest = useRef<PendingRequest | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  const loadConversations = useCallback(async () => {
    const rows = await apiRequest<Conversation[]>("/assistant/conversations?limit=50");
    setConversations(rows);
    setActiveConversationId((current) => {
      if (current && rows.some((conversation) => conversation.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
  }, [apiRequest]);

  const loadWorkspace = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const [providerStatus, rows] = await Promise.all([
        apiRequest<AssistantStatus>("/assistant/status"),
        apiRequest<Conversation[]>("/assistant/conversations?limit=50"),
      ]);
      setAssistantStatus(providerStatus);
      setConversations(rows);
      const previousActiveId = activeConversationRef.current;
      const nextActiveId =
        previousActiveId && rows.some((conversation) => conversation.id === previousActiveId)
          ? previousActiveId
          : rows[0]?.id ?? null;
      if (nextActiveId !== previousActiveId) {
        activeConversationRef.current = nextActiveId;
        setMessages([]);
        setMessagesLoading(Boolean(nextActiveId));
      }
      setActiveConversationId(nextActiveId);
      setError(null);
    } catch (cause) {
      setAssistantStatus(null);
      setError(getErrorMessage(cause, "Não foi possível carregar o assistente."));
    } finally {
      setInitialLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    let current = true;

    Promise.all([
      apiRequest<AssistantStatus>("/assistant/status"),
      apiRequest<Conversation[]>("/assistant/conversations?limit=50"),
    ])
      .then(([providerStatus, rows]) => {
        if (!current) return;

        setAssistantStatus(providerStatus);
        setConversations(rows);
        const previousActiveId = activeConversationRef.current;
        const nextActiveId =
          previousActiveId && rows.some((conversation) => conversation.id === previousActiveId)
            ? previousActiveId
            : rows[0]?.id ?? null;
        if (nextActiveId !== previousActiveId) {
          activeConversationRef.current = nextActiveId;
          setMessages([]);
          setMessagesLoading(Boolean(nextActiveId));
        }
        setActiveConversationId(nextActiveId);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (current) {
          setAssistantStatus(null);
          setError(getErrorMessage(cause, "Não foi possível carregar o assistente."));
        }
      })
      .finally(() => {
        if (current) setInitialLoading(false);
      });

    return () => {
      current = false;
    };
  }, [apiRequest]);

  useEffect(() => {
    if (!activeConversationId) return;

    let current = true;

    apiRequest<AssistantMessage[]>(
      `/assistant/conversations/${activeConversationId}/messages?limit=100`,
    )
      .then((rows) => {
        if (current) setMessages(rows);
      })
      .catch((cause: unknown) => {
        if (current) {
          setError(getErrorMessage(cause, "Não foi possível carregar o histórico."));
          setMessages([]);
        }
      })
      .finally(() => {
        if (current) setMessagesLoading(false);
      });

    return () => {
      current = false;
    };
  }, [activeConversationId, apiRequest]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, messagesLoading]);

  function clearContextSelection() {
    setContextSelection([]);
    setContextPreview(null);
    setContextPreviewLoading(false);
    setContextError(null);
    setContextPanelOpen(false);
  }

  async function toggleContextPanel() {
    if (contextPanelOpen) {
      clearContextSelection();
      return;
    }

    setContextPanelOpen(true);
    setContextLoading(true);
    setContextError(null);
    try {
      const [memories, projects, tasks] = await Promise.all([
        apiRequest<MemorySource[]>("/memories?include_archived=false&limit=100"),
        apiRequest<ProjectSource[]>("/projects?limit=100"),
        apiRequest<TaskSource[]>("/tasks?limit=100"),
      ]);
      const options: ContextOption[] = [
        ...memories.map((item) => ({
          source_type: "memory" as const,
          source_id: item.id,
          title: item.title,
          description: "Memória · " + item.category,
        })),
        ...projects.map((item) => ({
          source_type: "project" as const,
          source_id: item.id,
          title: item.name,
          description: "Projeto · " + item.status,
        })),
        ...tasks.map((item) => ({
          source_type: "task" as const,
          source_id: item.id,
          title: item.title,
          description: "Tarefa · " + item.priority + " · " + item.status,
        })),
      ];
      setContextOptions(options);
    } catch (cause) {
      setContextError(getErrorMessage(cause, "Não foi possível carregar suas fontes."));
    } finally {
      setContextLoading(false);
    }
  }

  function toggleContextItem(option: ContextOption, checked: boolean) {
    const exists = contextSelection.some(
      (item) =>
        item.source_type === option.source_type &&
        item.source_id === option.source_id,
    );
    if (checked && !exists) {
      if (contextSelection.length >= 8) {
        setContextError("O limite é de 8 fontes por mensagem.");
        return;
      }
      setContextSelection((current) => [
        ...current,
        { source_type: option.source_type, source_id: option.source_id },
      ]);
    } else if (!checked && exists) {
      setContextSelection((current) =>
        current.filter(
          (item) =>
            item.source_type !== option.source_type ||
            item.source_id !== option.source_id,
        ),
      );
    }
    setContextPreview(null);
    setContextError(null);
    pendingRequest.current = null;
  }

  async function generateContextPreview() {
    if (contextSelection.length === 0 || contextPreviewLoading) return;
    setContextPreviewLoading(true);
    setContextPreview(null);
    setContextError(null);
    try {
      const preview = await apiRequest<ContextPreview>("/assistant/context-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: contextSelection }),
      });
      setContextPreview(preview);
    } catch (cause) {
      setContextError(getErrorMessage(cause, "Não foi possível gerar a prévia do contexto."));
    } finally {
      setContextPreviewLoading(false);
    }
  }

  async function createConversation() {
    if (creatingConversation || sending || deletingConversation || savingTitle) return;
    setCreatingConversation(true);
    setError(null);
    try {
      const conversation = await apiRequest<Conversation>("/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nova conversa" }),
      });
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      activeConversationRef.current = conversation.id;
      setActiveConversationId(conversation.id);
      setMessages([]);
      setMessagesLoading(true);
      setRenamingConversation(false);
      setConfirmDelete(false);
      pendingRequest.current = null;
      clearContextSelection();
    } catch (cause) {
      setError(getErrorMessage(cause, "Não foi possível criar a conversa."));
    } finally {
      setCreatingConversation(false);
    }
  }

  const currentConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );

  function beginRename() {
    if (!currentConversation) return;
    setRenameTitle(currentConversation.title);
    setRenamingConversation(true);
    setConfirmDelete(false);
    setError(null);
  }

  async function saveConversationTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const conversationId = activeConversationId;
    const title = renameTitle.trim();
    if (!conversationId || !title || savingTitle || sending) return;

    setSavingTitle(true);
    setError(null);
    try {
      const updated = await apiRequest<Conversation>(
        `/assistant/conversations/${conversationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        },
      );
      setConversations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (activeConversationRef.current === conversationId) {
        setRenamingConversation(false);
      }
    } catch (cause) {
      setError(getErrorMessage(cause, "Não foi possível renomear a conversa."));
    } finally {
      setSavingTitle(false);
    }
  }

  async function deleteCurrentConversation() {
    const conversationId = activeConversationId;
    if (!conversationId || deletingConversation || sending || savingTitle) return;

    setDeletingConversation(true);
    setError(null);
    try {
      await apiRequest<void>(
        `/assistant/conversations/${conversationId}`,
        { method: "DELETE" },
      );
      const remaining = conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );
      setConversations(remaining);
      if (activeConversationRef.current === conversationId) {
        const nextConversationId = remaining[0]?.id ?? null;
        activeConversationRef.current = nextConversationId;
        setActiveConversationId(nextConversationId);
        setMessages([]);
        setMessagesLoading(Boolean(nextConversationId));
        pendingRequest.current = null;
        setRenamingConversation(false);
        setConfirmDelete(false);
      }
    } catch (cause) {
      setError(getErrorMessage(cause, "Não foi possível excluir a conversa."));
    } finally {
      setDeletingConversation(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const conversationId = activeConversationId;
    const content = draft.trim();
    if (!conversationId || !content || sending || !assistantStatus?.configured) return;
    if (contextSelection.length > 0 && !contextPreview) {
      setContextError("Gere e confira a prévia antes de enviar esta mensagem.");
      return;
    }

    const contextItems = contextPreview
      ? contextPreview.items.map((item) => ({
          source_type: item.source_type,
          source_id: item.source_id,
        }))
      : [];
    const contextHash = contextPreview?.context_hash ?? null;
    const fingerprint = JSON.stringify({
      content,
      context_items: contextItems,
      context_hash: contextHash,
    });
    if (!pendingRequest.current || pendingRequest.current.fingerprint !== fingerprint) {
      pendingRequest.current = {
        content,
        fingerprint,
        requestId: crypto.randomUUID(),
      };
    }

    setSending(true);
    setError(null);
    try {
      const result = await apiRequest<AssistantMessage[]>(
        `/assistant/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id: pendingRequest.current.requestId,
            content,
            ...(contextItems.length > 0
              ? { context_items: contextItems, context_hash: contextHash }
              : {}),
          }),
        },
      );

      if (activeConversationRef.current === conversationId) {
        setMessages((current) => {
          const knownIds = new Set(current.map((message) => message.id));
          return [...current, ...result.filter((message) => !knownIds.has(message.id))];
        });
      }
      setDraft("");
      pendingRequest.current = null;
      clearContextSelection();
      try {
        await loadConversations();
      } catch {
        setError("Mensagem salva. Não foi possível atualizar a lista de conversas.");
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409 && contextItems.length > 0) {
        setContextPreview(null);
        setContextError("Uma fonte mudou desde a prévia. Gere uma nova prévia e confirme novamente.");
      }
      setError(
        getErrorMessage(
          cause,
          "Não foi possível concluir o envio. A mensagem foi mantida para uma nova tentativa.",
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const providerState =
    assistantStatus?.state ?? (initialLoading ? "checking" : "unavailable");
  const stateInfo = assistantStatus
    ? statusCopy[assistantStatus.state]
    : {
        title: "API indisponível",
        detail: "Não foi possível consultar a configuração do assistente no servidor.",
      };

  return (
    <section className="panel assistant-workspace" id="assistant" aria-label="Assistente de IA">
      <header className="assistant-workspace-header">
        <div className="assistant-workspace-title">
          <span className="assistant-workspace-icon"><Bot size={19} /></span>
          <div>
            <span className="eyebrow">INTELIGÊNCIA PESSOAL</span>
            <h2>Assistente D.A.R.V.I.S.</h2>
          </div>
        </div>
        <div className={`assistant-provider-state state-${providerState}`}>
          <span />
          {initialLoading ? "CONSULTANDO" : stateInfo.title.toUpperCase()}
        </div>
      </header>

      {assistantStatus ? (
        <div className={`assistant-configuration-note note-${assistantStatus.state}`}>
          {assistantStatus.state === "configured" ? (
            <CheckCircle2 size={15} />
          ) : (
            <WifiOff size={15} />
          )}
          <span>
            <strong>{stateInfo.title}.</strong> {stateInfo.detail}
            {assistantStatus.configured && assistantStatus.provider && assistantStatus.model
              ? ` Provedor: ${assistantStatus.provider} · Modelo: ${assistantStatus.model}.`
              : ""}
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="assistant-error" role="alert">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button type="button" onClick={() => void loadWorkspace()}>Atualizar</button>
        </div>
      ) : null}

      <div className="assistant-workspace-body">
        <aside className="assistant-conversation-sidebar" aria-label="Conversas">
          <button
            className="assistant-new-conversation"
            type="button"
            onClick={() => void createConversation()}
            disabled={
              creatingConversation ||
              initialLoading ||
              sending ||
              deletingConversation ||
              savingTitle ||
              renamingConversation ||
              confirmDelete
            }
          >
            {creatingConversation ? (
              <LoaderCircle size={15} className="auth-spin" />
            ) : (
              <MessageSquarePlus size={15} />
            )}
            Nova conversa
          </button>

          <div className="assistant-history-heading">
            <span>HISTÓRICO</span>
            <span>{initialLoading ? "—" : conversations.length}</span>
          </div>

          {initialLoading ? (
            <div className="assistant-history-empty">
              <LoaderCircle size={15} className="auth-spin" />
              Carregando…
            </div>
          ) : conversations.length === 0 ? (
            <div className="assistant-history-empty">
              <MessageSquare size={15} />
              Ainda não há conversas.
            </div>
          ) : (
            <nav className="assistant-conversation-list" aria-label="Selecionar conversa">
              {conversations.map((conversation) => (
                <button
                  className={`assistant-conversation-item ${
                    conversation.id === activeConversationId ? "selected" : ""
                  }`}
                  type="button"
                  key={conversation.id}
                  onClick={() => {
                    if (activeConversationRef.current === conversation.id) return;
                    activeConversationRef.current = conversation.id;
                    setActiveConversationId(conversation.id);
                    setMessages([]);
                    setMessagesLoading(true);
                    setError(null);
                    setRenamingConversation(false);
                    setConfirmDelete(false);
                    pendingRequest.current = null;
                    clearContextSelection();
                  }}
                  disabled={
                    sending ||
                    deletingConversation ||
                    savingTitle ||
                    renamingConversation ||
                    confirmDelete
                  }
                >
                  <strong>{conversation.title}</strong>
                  <span>{formatConversationDate(conversation.updated_at)}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        <div className="assistant-chat">
          <div className="assistant-chat-heading">
            <div className="assistant-chat-heading-copy">
              <span className="eyebrow">CONVERSA ATUAL</span>
              {renamingConversation ? (
                <form className="assistant-rename-form" onSubmit={saveConversationTitle}>
                  <input
                    value={renameTitle}
                    onChange={(event) => setRenameTitle(event.target.value)}
                    aria-label="Novo título da conversa"
                    maxLength={120}
                    required
                  />
                  <button
                    type="submit"
                    aria-label="Salvar título"
                    title="Salvar título"
                    disabled={savingTitle || !renameTitle.trim()}
                  >
                    {savingTitle ? <LoaderCircle size={13} className="auth-spin" /> : <Save size={13} />}
                  </button>
                  <button
                    type="button"
                    aria-label="Cancelar renomeação"
                    title="Cancelar"
                    onClick={() => setRenamingConversation(false)}
                    disabled={savingTitle}
                  >
                    <X size={13} />
                  </button>
                </form>
              ) : (
                <h3>{currentConversation?.title ?? "Comece uma nova conversa"}</h3>
              )}
            </div>
            {currentConversation ? (
              <div className="assistant-chat-actions">
                <span className="assistant-chat-persistence">
                  <ShieldCheck size={13} /> SALVA NO POSTGRESQL
                </span>
                {!renamingConversation && !confirmDelete ? (
                  <>
                    <button
                      type="button"
                      className="assistant-chat-action"
                      onClick={beginRename}
                      disabled={sending || savingTitle || deletingConversation}
                      aria-label="Renomear conversa"
                      title="Renomear conversa"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="assistant-chat-action danger"
                      onClick={() => setConfirmDelete(true)}
                      disabled={sending || savingTitle || deletingConversation}
                      aria-label="Excluir conversa"
                      title="Excluir conversa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : null}
                {confirmDelete ? (
                  <div className="assistant-delete-confirm">
                    <span>Excluir histórico?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deletingConversation}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void deleteCurrentConversation()}
                      disabled={deletingConversation}
                    >
                      {deletingConversation ? "Excluindo…" : "Excluir"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="assistant-message-list" aria-live="polite" aria-relevant="additions">
            {messagesLoading ? (
              <div className="assistant-chat-empty">
                <LoaderCircle size={18} className="auth-spin" />
                Carregando histórico…
              </div>
            ) : !activeConversationId ? (
              <div className="assistant-chat-empty">
                <span className="assistant-empty-symbol"><Sparkles size={20} /></span>
                <strong>Um espaço para pensar junto.</strong>
                <span>Crie uma conversa para começar a organizar suas ideias.</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="assistant-chat-empty">
                <span className="assistant-empty-symbol"><Sparkles size={20} /></span>
                <strong>Qual é o primeiro assunto?</strong>
                <span>O histórico será salvo na sua conta e poderá ser retomado depois.</span>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  className={`assistant-message message-${message.role}`}
                  key={message.id}
                >
                  <span className="assistant-message-avatar">
                    {message.role === "assistant" ? <Bot size={15} /> : <span>DA</span>}
                  </span>
                  <div className="assistant-message-content">
                    <div className="assistant-message-meta">
                      <strong>{message.role === "assistant" ? "D.A.R.V.I.S." : "Você"}</strong>
                      <time dateTime={message.created_at}>
                        {formatMessageTime(message.created_at)}
                      </time>
                      {message.role === "assistant" && message.model ? (
                        <span>{message.model}</span>
                      ) : null}
                    </div>
                    <p>{message.content}</p>
                    {message.role === "user" && message.context_items?.length ? (
                      <div className="assistant-message-context">
                        <ShieldCheck size={12} />
                        Contexto compartilhado: {contextSummary(message.context_items)}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="assistant-context-toolbar">
            <div>
              <strong>Contexto desta mensagem</strong>
              <span>Memórias, projetos e tarefas só serão compartilhados com sua confirmação.</span>
            </div>
            <button
              type="button"
              className="assistant-context-trigger"
              onClick={() => void toggleContextPanel()}
              disabled={!assistantStatus?.configured || sending || !activeConversationId}
            >
              <BookOpen size={14} />
              {contextPanelOpen ? "Fechar seleção" : "Adicionar contexto"}
            </button>
          </div>

          {contextPanelOpen ? (
            <section className="assistant-context-panel" aria-label="Selecionar contexto">
              <div className="assistant-context-panel-heading">
                <div>
                  <strong>Escolha até 8 fontes</strong>
                  <span>Nenhum registro vem selecionado automaticamente.</span>
                </div>
                <span className="assistant-context-count">
                  {contextSelection.length}/8 selecionadas
                </span>
              </div>
              {contextLoading ? (
                <div className="assistant-context-state">
                  <LoaderCircle size={15} className="auth-spin" />
                  Carregando suas memórias, projetos e tarefas…
                </div>
              ) : contextOptions.length === 0 ? (
                <div className="assistant-context-state">
                  Nenhuma fonte disponível. Crie registros na Central de Memória, Projetos ou Tarefas.
                </div>
              ) : (
                <div className="assistant-context-options">
                  {contextOptions.map((option) => {
                    const selected = contextSelection.some(
                      (item) =>
                        item.source_type === option.source_type &&
                        item.source_id === option.source_id,
                    );
                    return (
                      <label
                        className="assistant-context-option"
                        key={option.source_type + "-" + option.source_id}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={sending || (!selected && contextSelection.length >= 8)}
                          onChange={(event) => toggleContextItem(option, event.target.checked)}
                        />
                        <span className="assistant-context-option-copy">
                          <strong>{contextTypeLabel[option.source_type]} · {option.title}</strong>
                          <small>{option.description}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {contextError ? (
                <div className="assistant-context-error" role="alert">{contextError}</div>
              ) : null}
              <div className="assistant-context-actions">
                <button
                  type="button"
                  className="assistant-context-secondary"
                  onClick={clearContextSelection}
                  disabled={sending || contextPreviewLoading}
                >
                  Cancelar seleção
                </button>
                <button
                  type="button"
                  className="assistant-context-primary"
                  onClick={() => void generateContextPreview()}
                  disabled={
                    contextLoading ||
                    contextPreviewLoading ||
                    contextSelection.length === 0 ||
                    sending
                  }
                >
                  {contextPreviewLoading ? (
                    <LoaderCircle size={13} className="auth-spin" />
                  ) : (
                    <ShieldCheck size={13} />
                  )}
                  Gerar prévia
                </button>
              </div>
            </section>
          ) : null}

          {contextPreview ? (
            <section className="assistant-context-preview" aria-label="Prévia do contexto que será enviado">
              <div className="assistant-context-preview-heading">
                <div>
                  <strong>Prévia pronta para confirmação</strong>
                  <span>
                    {contextPreview.items.length} fontes · {contextPreview.character_count.toLocaleString("pt-BR")} caracteres
                  </span>
                </div>
                <button
                  type="button"
                  className="assistant-context-clear"
                  onClick={clearContextSelection}
                  disabled={sending}
                >
                  <X size={13} />
                  Remover
                </button>
              </div>
              <div className="assistant-context-preview-items">
                {contextPreview.items.map((item) => (
                  <span key={item.source_type + "-" + item.source_id}>
                    {contextTypeLabel[item.source_type]} · {item.title}
                  </span>
                ))}
              </div>
              <pre>{contextPreview.context_text}</pre>
              <p>
                Esta é a representação exata do contexto adicional que será enviada ao provedor junto do histórico e da sua mensagem. O envio só acontece quando você clicar em Enviar.
              </p>
            </section>
          ) : null}

          <form className="assistant-composer" onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={
                initialLoading
                  ? "Consultando a configuração do assistente…"
                  : !assistantStatus
                    ? "A API não confirmou o estado do assistente."
                    : assistantStatus.configured
                      ? "Escreva sua mensagem…"
                      : "Configure o provedor no servidor para habilitar o envio…"
              }
              aria-label="Mensagem para o assistente"
              maxLength={16000}
              rows={3}
              disabled={!assistantStatus?.configured || !activeConversationId || sending}
            />
            <div className="assistant-composer-footer">
              <span>
                <CircleHelp size={13} />
                {assistantStatus?.configured
                  ? contextSelection.length > 0 && !contextPreview
                    ? "Gere a prévia do contexto antes de enviar"
                    : "Enter envia · Shift + Enter quebra linha"
                  : "Ferramentas e ações automáticas ainda não estão habilitadas"}
              </span>
              <button
                className="assistant-send-button"
                type="submit"
                disabled={
                  !assistantStatus?.configured ||
                  !activeConversationId ||
                  !draft.trim() ||
                  (contextSelection.length > 0 && !contextPreview) ||
                  sending
                }
              >
                {sending ? (
                  <LoaderCircle size={16} className="auth-spin" />
                ) : (
                  <Send size={15} />
                )}
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
