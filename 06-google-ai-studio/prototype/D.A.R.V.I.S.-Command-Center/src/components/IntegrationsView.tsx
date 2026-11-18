import { useState } from 'react';
import { Info } from 'lucide-react';
import { PLANNED_INTEGRATIONS } from '../data/seedData';
import { MaturityTag } from './MaturityTag';

interface IntegrationsViewProps {
  aiConfigured: boolean | null;
}

export function IntegrationsView({ aiConfigured }: IntegrationsViewProps) {
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Central de Integrações
          </h2>
          <MaturityTag
            maturity="planned"
            labelOverride="Somente Gemini Ativo · Demais Serviços Planejados"
          />
        </div>
        <p className="text-sm text-ink-muted mt-1">
          Transparência estrita: serviços externos não simulam conexão ativa antes de sua implementação real nas Fases 4–7.
        </p>
      </div>

      {selectedNotice && (
        <div
          role="status"
          className="rounded-xl bg-surface border border-accent-soft-border p-4 flex items-start justify-between gap-4 text-sm text-ink-secondary"
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-accent-text mt-0.5 shrink-0" aria-hidden="true" />
            <p>{selectedNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedNotice(null)}
            className="text-xs text-ink-muted hover:text-ink shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLANNED_INTEGRATIONS.map((service) => {
          const isGemini = service.id === 'int-gemini';
          const effectiveMaturity = isGemini
            ? aiConfigured
              ? 'implemented'
              : 'simulated'
            : service.maturity;

          const statusLabel = isGemini
            ? aiConfigured
              ? 'Implementado · Conectado via Backend'
              : 'Implementado · Aguardando Chave no Servidor'
            : `Não Conectado · ${service.targetPhase}`;

          return (
            <article
              key={service.id}
              className="rounded-xl bg-surface border border-edge p-6 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-ink-muted">{service.category}</span>
                  <MaturityTag
                    maturity={effectiveMaturity}
                    labelOverride={statusLabel}
                  />
                </div>
                <h3 className="font-display text-base font-semibold text-ink">
                  {service.name}
                </h3>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-ink-subtle">{service.architectureNote}</p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNotice(
                      isGemini
                        ? aiConfigured
                          ? 'Google Gemini API está operacional via rota backend /api/ai/chat sem exposição de credenciais no frontend.'
                          : 'A camada de proxy /api/ai/chat está implementada. Configure GEMINI_API_KEY nas variáveis de ambiente do servidor para ativar.'
                        : `${service.name} está marcado como Não Conectado (${service.targetPhase}). Arquitetura prevista: ${service.architectureNote}`
                    )
                  }
                  className="px-3.5 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface transition-colors whitespace-nowrap shrink-0"
                >
                  {isGemini ? 'Verificar Estado' : 'Ver Especificação'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
