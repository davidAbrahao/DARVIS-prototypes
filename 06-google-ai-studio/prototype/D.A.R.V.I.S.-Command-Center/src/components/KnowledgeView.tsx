import { useState, type FormEvent } from 'react';
import { FileText, Folder, Plus, Save } from 'lucide-react';
import type { KnowledgeNote } from '../types/darvis';
import { MaturityTag } from './MaturityTag';

interface KnowledgeViewProps {
  notes: KnowledgeNote[];
  onSaveNote: (note: {
    id?: string;
    title: string;
    folder: string;
    content: string;
    tags: string[];
  }) => void;
}

export function KnowledgeView({ notes, onSaveNote }: KnowledgeViewProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id ?? '');
  const [isCreating, setIsCreating] = useState(false);

  const activeNote = notes.find((n) => n.id === selectedNoteId) ?? notes[0];

  const [editTitle, setEditTitle] = useState(activeNote?.title ?? '');
  const [editFolder, setEditFolder] = useState(activeNote?.folder ?? '00-Inbox');
  const [editContent, setEditContent] = useState(activeNote?.content ?? '');
  const [editTags, setEditTags] = useState(activeNote?.tags.join(', ') ?? '');
  const [savedNotice, setSavedNotice] = useState('');

  const selectNote = (note: KnowledgeNote) => {
    setIsCreating(false);
    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    setEditFolder(note.folder);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setSavedNotice('');
  };

  const startNewNote = () => {
    setIsCreating(true);
    setEditTitle('');
    setEditFolder('00-Inbox');
    setEditContent('# Nova Nota\n\nEscreva referências, estudos ou especificações em Markdown.');
    setEditTags('');
    setSavedNotice('');
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSaveNote({
      id: isCreating ? undefined : activeNote?.id,
      title: editTitle,
      folder: editFolder,
      content: editContent,
      tags,
    });
    setIsCreating(false);
    setSavedNotice('Nota salva localmente.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              Base de Conhecimento (Markdown)
            </h2>
            <MaturityTag
              maturity="simulated"
              labelOverride="Editor Local · Obsidian GitHub Sync Planejado (Fase 6)"
            />
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Documentos estruturados compatíveis com Obsidian Vault e futura busca semântica.
          </p>
        </div>

        <button
          type="button"
          onClick={startNewNote}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nova Nota Markdown</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Explorer */}
        <aside className="rounded-xl bg-surface border border-edge p-4 space-y-2">
          <p className="text-xs font-medium text-ink-muted px-2 mb-2">
            Arquivos do Vault ({notes.length})
          </p>
          <ul className="space-y-1">
            {notes.map((note) => {
              const active = !isCreating && activeNote?.id === note.id;
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => selectNote(note)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      active
                        ? 'bg-accent-soft border-accent-soft-border text-ink'
                        : 'border-transparent hover:bg-hover-surface text-ink-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-ink-muted mb-0.5">
                      <Folder className="w-3.5 h-3.5 text-accent-text" aria-hidden="true" />
                      <span>{note.folder}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium truncate">{note.title}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Markdown Editor */}
        <section className="lg:col-span-2 rounded-xl bg-surface border border-edge p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="note-title" className="block text-xs text-ink-muted mb-1">
                  Título da Nota
                </label>
                <input
                  id="note-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="note-folder" className="block text-xs text-ink-muted mb-1">
                  Pasta Obsidian
                </label>
                <input
                  id="note-folder"
                  type="text"
                  value={editFolder}
                  onChange={(e) => setEditFolder(e.target.value)}
                  className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="note-content" className="block text-xs text-ink-muted mb-1">
                Conteúdo Markdown
              </label>
              <textarea
                id="note-content"
                rows={12}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full font-mono bg-inset border border-edge-strong rounded-lg px-3 py-3 text-xs sm:text-sm text-ink-secondary leading-relaxed focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <label htmlFor="note-tags" className="sr-only">
                  Tags
                </label>
                <input
                  id="note-tags"
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Tags separadas por vírgula..."
                  className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-xs text-ink-secondary placeholder:text-ink-subtle"
                />
              </div>

              <div className="flex items-center gap-3">
                {savedNotice && (
                  <span className="text-xs text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700">
                    {savedNotice}
                  </span>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Salvar Nota</span>
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
