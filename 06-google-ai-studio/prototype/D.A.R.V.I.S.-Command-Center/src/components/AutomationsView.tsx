import { Play, ShieldAlert } from 'lucide-react';
import type { AutomationRoutine } from '../types/darvis';
import { MaturityTag } from './MaturityTag';

interface AutomationsViewProps {
  automations: AutomationRoutine[];
  onSimulateAutomation: (id: string) => void;
}

export function AutomationsView({
  automations,
  onSimulateAutomation,
}: AutomationsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Central de Automações & Agentes
          </h2>
          <MaturityTag
            maturity="simulated"
            labelOverride="Simulação Local · Workers Planejados (Fase 5)"
          />
        </div>
        <p className="text-sm text-ink-muted mt-1">
          Agentes especializados e rotinas programadas com governança de permissões.
          Testes manuais aqui geram registros reais na trilha de auditoria sem executar efeitos externos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {automations.map((auto) => (
          <article
            key={auto.id}
            className="rounded-xl bg-surface border border-edge p-6 flex flex-col justify-between gap-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs text-accent-text">{auto.agent}</span>
                <MaturityTag maturity={auto.maturity} />
              </div>

              <h3 className="font-display text-base font-semibold text-ink">
                {auto.name}
              </h3>
              <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                {auto.description}
              </p>

              <div className="mt-4 space-y-1.5 text-xs text-ink-muted">
                <p>Gatilho: {auto.trigger}</p>
                {auto.requiresApproval && (
                  <p className="flex items-center gap-1.5 text-amber-300 [[data-theme=minimalist-light]_&]:text-amber-700">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Exige aprovação humana antes de persistir alterações</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-edge flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-ink-subtle tabular-nums">
                Execuções demo: {auto.runCount}
              </span>
              <button
                type="button"
                onClick={() => onSimulateAutomation(auto.id)}
                disabled={auto.maturity === 'planned'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 text-accent-text" aria-hidden="true" />
                <span>
                  {auto.maturity === 'planned' ? 'Fase Futura' : 'Simular Execução'}
                </span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
