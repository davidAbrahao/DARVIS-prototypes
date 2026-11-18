import { Activity, Menu, MessageSquarePlus } from 'lucide-react';
import type { ModuleId } from '../types/darvis';
import { NAV_ITEMS } from './Sidebar';

interface TopBarProps {
  activeModule: ModuleId;
  onOpenMobileMenu: () => void;
  onQuickAssistant: () => void;
  aiThinking: boolean;
  aiConfigured: boolean | null;
}

export function TopBar({
  activeModule,
  onOpenMobileMenu,
  onQuickAssistant,
  aiThinking,
  aiConfigured,
}: TopBarProps) {
  const current = NAV_ITEMS.find((item) => item.id === activeModule);

  return (
    <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 bg-topbar backdrop-blur-md border-b border-edge flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Zone 1: Menu toggle (mobile) + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu de navegação"
          className="lg:hidden p-2 -ml-2 text-ink-muted hover:text-ink rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-ink-subtle hidden sm:inline whitespace-nowrap">
            D.A.R.V.I.S.
          </span>
          <span className="text-ink-subtle hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display text-base sm:text-lg font-semibold text-ink truncate">
            {current?.label ?? 'Command Center'}
          </h1>
        </div>
      </div>

      {/* Zone 2: Real AI activity indicator */}
      <div className="hidden md:flex items-center gap-2 text-xs text-ink-muted whitespace-nowrap shrink-0">
        <Activity
          className={`w-3.5 h-3.5 ${
            aiThinking
              ? 'text-accent-text animate-spin'
              : aiConfigured
              ? 'text-emerald-500'
              : 'text-amber-500'
          }`}
          aria-hidden="true"
        />
        <span>
          {aiThinking
            ? 'Processando inteligência...'
            : aiConfigured === null
            ? 'Verificando motor de IA...'
            : aiConfigured
            ? 'Motor Gemini pronto'
            : 'Motor Gemini sem chave configurada'}
        </span>
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onQuickAssistant}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-accent text-accent-ink hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <MessageSquarePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Consultar IA</span>
        </button>
      </div>
    </header>
  );
}
