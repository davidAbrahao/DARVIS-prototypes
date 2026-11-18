import { useState, type FormEvent } from 'react';
import { Check, Plus } from 'lucide-react';
import { calculateProjectProgress } from '../lib/darvisLogic';
import type { ProjectItem } from '../types/darvis';
import { MaturityTag } from './MaturityTag';

interface ProjectsViewProps {
  projects: ProjectItem[];
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onAddMilestone: (projectId: string, title: string) => void;
  onAddProject: (input: {
    name: string;
    objective: string;
    phase: string;
    firstMilestone: string;
  }) => void;
}

export function ProjectsView({
  projects,
  onToggleMilestone,
  onAddMilestone,
  onAddProject,
}: ProjectsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? '');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState('');

  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [phase, setPhase] = useState('');
  const [firstMilestone, setFirstMilestone] = useState('');

  const selectedProject =
    projects.find((p) => p.id === selectedId) ?? projects[0];

  const handleCreateProject = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !objective.trim()) return;
    onAddProject({ name, objective, phase, firstMilestone });
    setName('');
    setObjective('');
    setPhase('');
    setFirstMilestone('');
    setShowNewForm(false);
  };

  const handleAddMilestone = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMilestone.trim()) return;
    onAddMilestone(selectedProject.id, newMilestone);
    setNewMilestone('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              Projetos & Marcos
            </h2>
            <MaturityTag
              maturity="simulated"
              labelOverride="Persistência Local · Dados Demo"
            />
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Objetivos estratégicos, etapas executáveis e histórico de evolução.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{showNewForm ? 'Fechar' : 'Novo Projeto'}</span>
        </button>
      </div>

      {showNewForm && (
        <form
          onSubmit={handleCreateProject}
          className="rounded-xl bg-surface border border-edge p-6 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-ink">
            Criar Projeto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-name" className="block text-xs text-ink-muted mb-1">
                Nome do Projeto
              </label>
              <input
                id="proj-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Agente Local Windows"
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="proj-phase" className="block text-xs text-ink-muted mb-1">
                Fase / Estágio
              </label>
              <input
                id="proj-phase"
                type="text"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                placeholder="Ex.: Fase 7 · Arquitetura"
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="proj-obj" className="block text-xs text-ink-muted mb-1">
              Objetivo Principal
            </label>
            <textarea
              id="proj-obj"
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="proj-ms" className="block text-xs text-ink-muted mb-1">
              Primeira Etapa (opcional)
            </label>
            <input
              id="proj-ms"
              type="text"
              value={firstMilestone}
              onChange={(e) => setFirstMilestone(e.target.value)}
              className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover"
            >
              Salvar Projeto
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="space-y-3">
          {projects.map((project) => {
            const prog = calculateProjectProgress(project.milestones);
            const active = selectedProject?.id === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedId(project.id)}
                className={`w-full text-left rounded-xl p-5 border transition-colors ${
                  active
                    ? 'bg-accent-soft border-accent-soft-border'
                    : 'bg-surface border-edge hover:border-edge-strong'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-accent-text">{project.phase}</span>
                  <span className="font-mono text-xs text-ink-muted tabular-nums">
                    {prog.percentage}%
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-ink">
                  {project.name}
                </h3>
                <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                  {project.objective}
                </p>
              </button>
            );
          })}
        </div>

        {/* Project Detail */}
        {selectedProject && (
          <section className="lg:col-span-2 rounded-xl bg-surface border border-edge p-6 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-accent-text">
                  {selectedProject.phase} · Atualizado em {selectedProject.updatedAt}
                  {selectedProject.isDemo ? ' · Demo' : ''}
                </p>
                <span className="font-mono text-xs text-ink-secondary tabular-nums">
                  {calculateProjectProgress(selectedProject.milestones).completed}/
                  {calculateProjectProgress(selectedProject.milestones).total} etapas
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-ink mt-1">
                {selectedProject.name}
              </h3>
              <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                {selectedProject.objective}
              </p>
            </div>

            {/* Milestones */}
            <div>
              <h4 className="text-xs font-medium text-ink-muted mb-3">
                Etapas & Marcos
              </h4>
              <ul className="divide-y divide-edge">
                {selectedProject.milestones.map((ms) => (
                  <li key={ms.id} className="py-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleMilestone(selectedProject.id, ms.id)}
                      aria-label={`Alternar etapa ${ms.title}`}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        ms.completed
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700'
                          : 'border-edge-strong text-transparent hover:border-accent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`text-sm ${
                        ms.completed ? 'line-through text-ink-subtle' : 'text-ink-secondary'
                      }`}
                    >
                      {ms.title}
                    </span>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddMilestone} className="mt-3 flex gap-2">
                <input
                  type="text"
                  aria-label="Adicionar nova etapa ao projeto"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Adicionar nova etapa..."
                  className="flex-1 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface"
                >
                  Adicionar Etapa
                </button>
              </form>
            </div>

            {/* Evolution History */}
            <div className="pt-4 border-t border-edge">
              <h4 className="text-xs font-medium text-ink-muted mb-2">
                Histórico de Evolução
              </h4>
              <ul className="space-y-2 text-xs text-ink-muted">
                {selectedProject.history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <span className="font-mono text-ink-subtle tabular-nums shrink-0">
                      {h.date}
                    </span>
                    <span className="text-ink-secondary">{h.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
