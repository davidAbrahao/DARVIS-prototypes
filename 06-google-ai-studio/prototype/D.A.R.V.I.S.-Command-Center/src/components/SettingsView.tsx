import { useState } from 'react';
import { Download, RotateCcw, ShieldCheck } from 'lucide-react';
import type { DarvisState, SystemSettings } from '../types/darvis';
import { MaturityTag } from './MaturityTag';

const ROADMAP_PHASES = [
  {
    phase: 'Fase 1',
    title: 'Protótipo visual e experiência do usuário',
    status: 'implemented' as const,
  },
  {
    phase: 'Fase 2',
    title: 'Estrutura do backend (FastAPI) e autenticação',
    status: 'planned' as const,
  },
  {
    phase: 'Fase 3',
    title: 'Banco de dados PostgreSQL e memória persistente',
    status: 'planned' as const,
  },
  {
    phase: 'Fase 4',
    title: 'Integração completa Gemini + Telegram Bot',
    status: 'simulated' as const,
  },
  {
    phase: 'Fase 5',
    title: 'Agentes, ferramentas e automações em Workers',
    status: 'planned' as const,
  },
  {
    phase: 'Fase 6',
    title: 'Sincronização bidirecional com Obsidian Vault',
    status: 'planned' as const,
  },
  {
    phase: 'Fase 7',
    title: 'Experiência mobile PWA, voz e agente Windows',
    status: 'planned' as const,
  },
];

interface SettingsViewProps {
  state: DarvisState;
  onUpdateSettings: (patch: Partial<SystemSettings>) => void;
  onResetDemo: () => void;
}

export function SettingsView({
  state,
  onUpdateSettings,
  onResetDemo,
}: SettingsViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `darvis-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          Configurações, Segurança & Auditoria
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Preferências operacionais, governança de ações, trilha de auditoria e roadmap evolutivo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile & AI Governance */}
        <section className="rounded-xl bg-surface border border-edge p-6 space-y-5">
          <h3 className="font-display text-base font-semibold text-ink">
            Perfil & Governança do Usuário
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <label htmlFor="cfg-name" className="block text-xs text-ink-muted mb-1.5">
                Identificação do Operador
              </label>
              <input
                id="cfg-name"
                type="text"
                value={state.settings.userName}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="cfg-email" className="block text-xs text-ink-muted mb-1.5">
                E-mail Principal
              </label>
              <input
                id="cfg-email"
                type="email"
                value={state.settings.userEmail}
                onChange={(e) => onUpdateSettings({ userEmail: e.target.value })}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div className="pt-2 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 text-ink-secondary">
                <ShieldCheck className="w-4 h-4 text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Segredos de API são mantidos exclusivamente em variáveis de ambiente no servidor e nunca expostos ao navegador.
                </span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={state.settings.requireHumanApproval}
                  onChange={(e) =>
                    onUpdateSettings({ requireHumanApproval: e.target.checked })
                  }
                  className="mt-0.5 rounded border-edge-strong bg-inset accent-accent"
                />
                <span>
                  <span className="block text-ink-secondary font-medium">
                    Exigir aprovação humana para ações da IA
                  </span>
                  <span className="text-ink-muted">
                    Solicita confirmação explícita antes de gravar tarefas, memórias ou notas.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-edge flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-secondary hover:bg-hover-surface transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Exportar Backup JSON</span>
            </button>

            {confirmReset ? (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onResetDemo();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 [[data-theme=minimalist-light]_&]:text-red-700 font-medium"
                >
                  Confirmar Reset Demo
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-ink-muted hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-edge-strong text-xs font-medium text-ink-muted hover:text-red-300 [[data-theme=minimalist-light]_&]:hover:text-red-700 hover:border-red-500/40 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Restaurar Dados Iniciais</span>
              </button>
            )}
          </div>
        </section>

        {/* Roadmap Phases 1-7 */}
        <section className="rounded-xl bg-surface border border-edge p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-ink">
            Estratégia de Desenvolvimento (Fases 1–7)
          </h3>
          <ul className="divide-y divide-edge">
            {ROADMAP_PHASES.map((item) => (
              <li
                key={item.phase}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono text-accent-text mr-2">{item.phase}</span>
                  <span className="text-ink-secondary">{item.title}</span>
                </div>
                <MaturityTag
                  maturity={item.status}
                  labelOverride={
                    item.status === 'implemented'
                      ? 'Em curso / Ativo'
                      : item.status === 'simulated'
                      ? 'Parcial (Gemini)'
                      : 'Planejado'
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Audit Log */}
      <section className="rounded-xl bg-surface border border-edge p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-base font-semibold text-ink">
            Trilha de Auditoria do Sistema
          </h3>
          <span className="font-mono text-xs text-ink-muted tabular-nums">
            {state.auditLog.length} eventos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-edge text-ink-muted">
                <th className="py-2.5 pr-4 font-medium">Horário</th>
                <th className="py-2.5 pr-4 font-medium">Ator</th>
                <th className="py-2.5 pr-4 font-medium">Módulo</th>
                <th className="py-2.5 pr-4 font-medium">Ação</th>
                <th className="py-2.5 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {state.auditLog.slice(0, 20).map((log) => (
                <tr key={log.id} className="text-ink-secondary">
                  <td className="py-2.5 pr-4 font-mono text-ink-muted tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">{log.actor}</td>
                  <td className="py-2.5 pr-4 text-ink-muted whitespace-nowrap">
                    {log.module}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-ink whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 text-ink-muted">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
