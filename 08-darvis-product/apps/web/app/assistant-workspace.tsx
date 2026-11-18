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
  Bot,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  MessageSquare,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Sparkles,
  WifiOff,
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

type AssistantMessage = {
  id: number;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  provider: string | null;
  model: string | null;
  created_at: string;
};

type PendingRequest = {
  content: string;
  requestId: string;
};

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
      "A configuração foi detectada. A disponibilidade será confirmada ao enviar uma mensagem.",
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
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      setActiveConversationId((current) => {
        if (current && rows.some((conversation) => conversation.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (cause) {
      setAssistantStatus(null);
      setError(getErrorMessage(cause, "Não foi possível carregar o assistente."));
    } finally {
      setInitialLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let current = true;
    setMessagesLoading(true);
    setError(null);

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

  async function createConversation() {
    if (creatingConversation) return;
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
      setActiveConversationId(conversation.id);
      setMessages([]);
      pendingRequest.current = null;
    } catch (cause) {
      setError(getErrorMessage(cause, "Não foi possível criar a conversa."));
    } finally {
      setCreatingConversation(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const conversationId = activeConversationId;
    const content = draft.trim();
    if (!conversationId || !content || sending || !assistantStatus?.configured) return;

    if (!pendingRequest.current || pendingRequest.current.content !== content) {
      pendingRequest.current = {
        content,
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
      try {
        await loadConversations();
      } catch {
        setError("Mensagem salva. Não foi possível atualizar a lista de conversas.");
      }
    } catch (cause) {
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

  const currentConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const providerState = assistantStatus?.state ?? "unavailable";
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
            disabled={creatingConversation || initialLoading}
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
                  onClick={() => setActiveConversationId(conversation.id)}
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
            <div>
              <span className="eyebrow">CONVERSA ATUAL</span>
              <h3>{currentConversation?.title ?? "Comece uma nova conversa"}</h3>
            </div>
            {currentConversation ? (
              <span className="assistant-chat-persistence">
                <ShieldCheck size={13} /> SALVA NO POSTGRESQL
              </span>
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
                  </div>
                </article>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="assistant-composer" onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={
                assistantStatus?.configured
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
                  ? "Enter envia · Shift + Enter quebra linha"
                  : "Ferramentas e ações automáticas ainda não estão habilitadas"}
              </span>
              <button
                className="assistant-send-button"
                type="submit"
                disabled={
                  !assistantStatus?.configured ||
                  !activeConversationId ||
                  !draft.trim() ||
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
