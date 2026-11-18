import { useState, type FormEvent } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { filterMemories } from '../lib/darvisLogic';
import type { MemoryCategory, MemoryItem, ProjectItem } from '../types/darvis';
import { MaturityTag } from './MaturityTag';

const CATEGORIES: Array<'Todas' | MemoryCategory> = [
  'Todas',
  'Preferências',
  'Contexto Pessoal',
  'Decisões',
  'Conhecimento Técnico',
  'Projetos & Ideias',
];

interface MemoryViewProps {
  memories: MemoryItem[];
  projects: ProjectItem[];
  onAddMemory: (input: {
    title: string;
    content: string;
    category: MemoryCategory;
    tags: string[];
    projectId?: string;
  }) => void;
  onDeleteMemory: (id: string) => void;
}

export function MemoryView({
  memories,
  projects,
  onAddMemory,
  onDeleteMemory,
}: MemoryViewProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | MemoryCategory>('Todas');
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('Conhecimento Técnico');
  const [tagsRaw, setTagsRaw] = useState('');
  const [projectId, setProjectId] = useState('');
  const [formError, setFormError] = useState('');

  const filtered = filterMemories(memories, query, selectedCategory);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Informe um título e o conteúdo da memória.');
      return;
    }
    setFormError('');
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onAddMemory({
      title,
      content,
      category,
      tags,
      projectId: projectId || undefined,
    });
    setTitle('');
    setContent('');
    setTagsRaw('');
    setProjectId('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Maturity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              Central de Memória Persistente
            </h2>
            <MaturityTag
              maturity="implemented"
              labelOverride="Persistência Local · Busca Semântica Planejada"
            />
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Registros categorizados e independentes de modelo de IA. Total:{' '}
            <span className="font-mono tabular-nums text-ink-secondary">{memories.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{showForm ? 'Fechar Formulário' : 'Nova Memória'}</span>
        </button>
      </div>

      {/* Create Memory Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-surface border border-edge p-6 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-ink">
            Registrar Nova Memória
          </h3>
          {formError && (
            <p role="alert" className="text-xs text-red-400 [[data-theme=minimalist-light]_&]:text-red-600">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mem-title" className="block text-xs text-ink-muted mb-1.5">
                Título
              </label>
              <input
                id="mem-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Padrão de autenticação FastAPI"
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="mem-category" className="block text-xs text-ink-muted mb-1.5">
                Categoria
              </label>
              <select
                id="mem-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              >
                {CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mem-content" className="block text-xs text-ink-muted mb-1.5">
              Conteúdo / Contexto
            </label>
            <textarea
              id="mem-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva a decisão, preferência ou conhecimento durável..."
              className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mem-tags" className="block text-xs text-ink-muted mb-1.5">
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                id="mem-tags"
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="arquitetura, seguranca, backend"
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="mem-project" className="block text-xs text-ink-muted mb-1.5">
                Vincular a Projeto (opcional)
              </label>
              <select
                id="mem-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              >
                <option value="">Sem vínculo específico</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover"
            >
              Salvar Memória
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <label htmlFor="memory-search" className="sr-only">
            Buscar memórias
          </label>
          <input
            id="memory-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por título, conteúdo ou palavra-chave..."
            className="w-full bg-surface border border-edge rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-surface border border-edge rounded-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Records */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface border border-edge p-10 text-center">
          <p className="text-sm text-ink-secondary">Nenhuma memória encontrada para este filtro.</p>
          <p className="text-xs text-ink-subtle mt-1">
            Ajuste os termos de busca ou registre um novo item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mem) => {
            const linkedProject = projects.find((p) => p.id === mem.projectId);
            return (
              <article
                key={mem.id}
                className="rounded-xl bg-surface border border-edge p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-accent-text">
                      {mem.category} · {mem.source}
                      {mem.isDemo ? ' · Demo' : ''}
                    </p>
                    {confirmDeleteId === mem.id ? (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteMemory(mem.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-red-400 [[data-theme=minimalist-light]_&]:text-red-600 hover:opacity-80 font-medium"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-ink-muted hover:text-ink"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(mem.id)}
                        aria-label={`Remover memória ${mem.title}`}
                        className="p-1 text-ink-subtle hover:text-red-400 [[data-theme=minimalist-light]_&]:hover:text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-display text-base font-semibold text-ink mt-1.5">
                    {mem.title}
                  </h3>
                  <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                    {mem.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-edge flex flex-wrap items-center justify-between gap-2 text-xs text-ink-subtle">
                  <span>
                    {mem.tags.length > 0 ? mem.tags.join(' · ') : 'Sem marcadores'}
                    {linkedProject ? ` / Projeto: ${linkedProject.name}` : ''}
                  </span>
                  <span className="font-mono tabular-nums">
                    {new Date(mem.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
