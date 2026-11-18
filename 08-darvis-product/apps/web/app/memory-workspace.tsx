"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Archive,
  BookOpen,
  Check,
  CircleHelp,
  LoaderCircle,
  Pin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { ApiError } from "../lib/auth-api";
import { useAuth } from "./auth-provider";

type MemoryCategory =
  | "fact"
  | "preference"
  | "goal"
  | "work"
  | "relationship"
  | "routine"
  | "other";

type MemoryEntry = {
  id: number;
  title: string;
  content: string;
  category: MemoryCategory;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  source: "manual";
  created_at: string;
  updated_at: string;
};

type MemoryDraft = {
  title: string;
  content: string;
  category: MemoryCategory;
  tags: string;
};

const categories: { value: MemoryCategory; label: string }[] = [
  { value: "fact", label: "Fato" },
  { value: "preference", label: "Preferência" },
  { value: "goal", label: "Objetivo" },
  { value: "work", label: "Trabalho" },
  { value: "relationship", label: "Relacionamento" },
  { value: "routine", label: "Rotina" },
  { value: "other", label: "Outro" },
];

const categoryLabel = new Map(categories.map((item) => [item.value, item.label]));

const emptyDraft: MemoryDraft = {
  title: "",
  content: "",
  category: "fact",
  tags: "",
};

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function toTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function MemoryWorkspace() {
  const { apiRequest } = useAuth();
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyEntryId, setBusyEntryId] = useState<number | null>(null);
  const [draft, setDraft] = useState<MemoryDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      include_archived: String(showArchived),
      limit: "100",
    });
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (searchQuery.length >= 2) params.set("query", searchQuery);

    try {
      const rows = await apiRequest<MemoryEntry[]>(`/memories?${params.toString()}`);
      setEntries(rows);
    } catch (cause) {
      setError(messageFor(cause, "Não foi possível carregar sua memória."));
    } finally {
      setLoading(false);
    }
  }, [apiRequest, categoryFilter, searchQuery, showArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  function beginCreate() {
    setDraft(emptyDraft);
    setEditingId(null);
    setConfirmDeleteId(null);
    setShowForm(true);
  }

  function beginEdit(entry: MemoryEntry) {
    setDraft({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags.join(", "),
    });
    setEditingId(entry.id);
    setConfirmDeleteId(null);
    setShowForm(true);
    setError(null);
  }

  async function saveMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const payload = {
      title: draft.title.trim(),
      content: draft.content.trim(),
      category: draft.category,
      tags: toTags(draft.tags),
    };
    if (!payload.title || !payload.content) return;

    setSaving(true);
    setError(null);
    try {
      if (editingId !== null) {
        await apiRequest<MemoryEntry>(`/memories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<MemoryEntry>("/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setEditingId(null);
      setDraft(emptyDraft);
      await load();
    } catch (cause) {
      setError(messageFor(cause, "Não foi possível salvar este registro."));
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(entry: MemoryEntry) {
    if (busyEntryId !== null) return;
    setBusyEntryId(entry.id);
    setError(null);
    try {
      await apiRequest<MemoryEntry>(`/memories/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !entry.is_pinned }),
      });
      await load();
    } catch (cause) {
      setError(messageFor(cause, "Não foi possível atualizar o registro."));
    } finally {
      setBusyEntryId(null);
    }
  }

  async function toggleArchive(entry: MemoryEntry) {
    if (busyEntryId !== null) return;
    setBusyEntryId(entry.id);
    setError(null);
    try {
      await apiRequest<MemoryEntry>(`/memories/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: !entry.is_archived }),
      });
      await load();
    } catch (cause) {
      setError(messageFor(cause, "Não foi possível atualizar o registro."));
    } finally {
      setBusyEntryId(null);
    }
  }

  async function deleteMemory(entry: MemoryEntry) {
    if (busyEntryId !== null) return;
    setBusyEntryId(entry.id);
    setError(null);
    try {
      await apiRequest<void>(`/memories/${entry.id}`, { method: "DELETE" });
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setConfirmDeleteId(null);
      if (editingId === entry.id) {
        setShowForm(false);
        setEditingId(null);
        setDraft(emptyDraft);
      }
    } catch (cause) {
      setError(messageFor(cause, "Não foi possível excluir este registro."));
    } finally {
      setBusyEntryId(null);
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(searchDraft.trim());
  }

  function resetFilters() {
    setSearchDraft("");
    setSearchQuery("");
    setCategoryFilter("all");
    setShowArchived(false);
  }

  return (
    <section className="panel memory-workspace" id="memory" aria-label="Central de Memória">
      <header className="memory-header">
        <div className="memory-title">
          <span className="memory-title-icon"><BookOpen size={19} /></span>
          <div>
            <span className="eyebrow">CONHECIMENTO SOB SEU CONTROLE</span>
            <h2>Central de Memória</h2>
          </div>
        </div>
        <div className="memory-header-actions">
          <span className="memory-source-label"><ShieldCheck size={13} /> POSTGRESQL</span>
          <button
            className="memory-create-button"
            type="button"
            onClick={beginCreate}
            disabled={showForm}
          >
            <Plus size={15} /> Novo registro
          </button>
        </div>
      </header>

      <div className="memory-privacy-note">
        <CircleHelp size={15} />
        <span>
          Registros são criados manualmente. O assistente não lê nem compartilha estas memórias
          automaticamente; a seleção de contexto será uma ação explícita em outra etapa.
        </span>
      </div>

      {error ? (
        <div className="memory-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>Tentar novamente</button>
        </div>
      ) : null}

      {showForm ? (
        <form className="memory-editor" onSubmit={saveMemory}>
          <div className="memory-editor-heading">
            <div>
              <span className="eyebrow">{editingId === null ? "NOVO REGISTRO" : "EDITAR REGISTRO"}</span>
              <h3>{editingId === null ? "O que vale a pena lembrar?" : "Atualizar memória"}</h3>
            </div>
            <button
              className="memory-icon-button"
              type="button"
              aria-label="Cancelar edição"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setDraft(emptyDraft);
              }}
              disabled={saving}
            >
              <X size={16} />
            </button>
          </div>

          <div className="memory-editor-grid">
            <label>
              <span>TÍTULO</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Minha forma preferida de trabalhar"
                maxLength={140}
                required
              />
            </label>
            <label>
              <span>CATEGORIA</span>
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value as MemoryCategory,
                  }))
                }
              >
                {categories.map((category) => (
                  <option value={category.value} key={category.value}>{category.label}</option>
                ))}
              </select>
            </label>
            <label className="memory-editor-wide">
              <span>CONTEÚDO</span>
              <textarea
                value={draft.content}
                onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                placeholder="Registre aqui a informação que deseja manter..."
                maxLength={12000}
                rows={4}
                required
              />
            </label>
            <label className="memory-editor-wide">
              <span>ETIQUETAS · SEPARADAS POR VÍRGULA</span>
              <input
                value={draft.tags}
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                placeholder="Ex.: trabalho, preferência, rotina"
              />
            </label>
          </div>

          <div className="memory-editor-footer">
            <span>Até 12 etiquetas · 32 caracteres cada</span>
            <button type="submit" className="memory-save-button" disabled={saving}>
              {saving ? <LoaderCircle size={15} className="auth-spin" /> : <Check size={15} />}
              {saving ? "Salvando…" : "Salvar memória"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="memory-toolbar">
        <form className="memory-search" onSubmit={search}>
          <Search size={15} />
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Buscar no título ou conteúdo..."
            aria-label="Buscar memórias"
            maxLength={120}
          />
          <button type="submit" disabled={searchDraft.trim().length === 1}>
            Buscar
          </button>
        </form>
        <label className="memory-category-filter">
          <span className="sr-only">Filtrar por categoria</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as MemoryCategory | "all")}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option value={category.value} key={category.value}>{category.label}</option>
            ))}
          </select>
        </label>
        <label className="memory-archived-filter">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Incluir arquivadas
        </label>
        <button
          className="memory-refresh-button"
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Atualizar memórias"
          title="Atualizar"
        >
          <RefreshCw size={14} className={loading ? "auth-spin" : ""} />
        </button>
      </div>

      <div className="memory-results-heading">
        <span>SEUS REGISTROS</span>
        <span>{loading ? "CONSULTANDO" : `${entries.length} exibidos`}</span>
      </div>

      {loading ? (
        <div className="memory-empty-state">
          <LoaderCircle size={18} className="auth-spin" />
          Carregando memória…
        </div>
      ) : entries.length === 0 ? (
        <div className="memory-empty-state">
          <BookOpen size={20} />
          <strong>Nenhum registro encontrado.</strong>
          <span>Crie uma memória manual ou ajuste seus filtros de pesquisa.</span>
          {(searchQuery || categoryFilter !== "all" || showArchived) ? (
            <button type="button" onClick={resetFilters}>Limpar filtros</button>
          ) : null}
        </div>
      ) : (
        <div className="memory-entry-grid">
          {entries.map((entry) => (
            <article className={`memory-entry-card ${entry.is_archived ? "is-archived" : ""}`} key={entry.id}>
              <div className="memory-entry-top">
                <span className={`memory-category-pill category-${entry.category}`}>
                  {categoryLabel.get(entry.category)}
                </span>
                <div className="memory-entry-tools">
                  <button
                    type="button"
                    className={`memory-icon-button ${entry.is_pinned ? "is-pinned" : ""}`}
                    onClick={() => void togglePin(entry)}
                    disabled={busyEntryId !== null}
                    aria-label={entry.is_pinned ? "Desafixar memória" : "Fixar memória"}
                    title={entry.is_pinned ? "Desafixar" : "Fixar"}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    type="button"
                    className="memory-icon-button"
                    onClick={() => beginEdit(entry)}
                    disabled={busyEntryId !== null || showForm}
                    aria-label="Editar memória"
                    title="Editar"
                  >
                    <BookOpen size={14} />
                  </button>
                  <button
                    type="button"
                    className="memory-icon-button"
                    onClick={() => void toggleArchive(entry)}
                    disabled={busyEntryId !== null}
                    aria-label={entry.is_archived ? "Restaurar memória" : "Arquivar memória"}
                    title={entry.is_archived ? "Restaurar" : "Arquivar"}
                  >
                    <Archive size={14} />
                  </button>
                  <button
                    type="button"
                    className="memory-icon-button danger"
                    onClick={() => setConfirmDeleteId(entry.id)}
                    disabled={busyEntryId !== null}
                    aria-label="Excluir memória"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3>{entry.title}</h3>
              <p className="memory-entry-content">{entry.content}</p>

              {entry.tags.length > 0 ? (
                <div className="memory-tags">
                  {entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
              ) : null}

              {confirmDeleteId === entry.id ? (
                <div className="memory-delete-confirm" role="group" aria-label="Confirmar exclusão da memória">
                  <span>Excluir este registro permanentemente?</span>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={busyEntryId !== null}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void deleteMemory(entry)}
                    disabled={busyEntryId !== null}
                  >
                    {busyEntryId === entry.id ? "Excluindo…" : "Excluir"}
                  </button>
                </div>
              ) : null}

              <footer className="memory-entry-footer">
                <span>{entry.is_archived ? "ARQUIVADA" : entry.is_pinned ? "FIXADA" : "MANUAL"}</span>
                <time dateTime={entry.updated_at}>Atualizada {displayDate(entry.updated_at)}</time>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
