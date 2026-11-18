import {
  Bot,
  Brain,
  CheckSquare,
  Dumbbell,
  FolderKanban,
  LayoutDashboard,
  Library,
  Plug,
  Settings,
  Workflow,
  X,
} from 'lucide-react';
import type { FeatureMaturity, ModuleId } from '../types/darvis';

export interface NavItemConfig {
  id: ModuleId;
  label: string;
  group: 'Núcleo' | 'Organização' | 'Sistema';
  maturity: FeatureMaturity;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Command Center',
    group: 'Núcleo',
    maturity: 'implemented',
    icon: LayoutDashboard,
  },
  {
    id: 'assistant',
    label: 'Assistente IA',
    group: 'Núcleo',
    maturity: 'implemented',
    icon: Bot,
  },
  {
    id: 'memory',
    label: 'Central de Memória',
    group: 'Núcleo',
    maturity: 'implemented',
    icon: Brain,
  },
  {
    id: 'management',
    label: 'Gestão Pessoal',
    group: 'Organização',
    maturity: 'simulated',
    icon: CheckSquare,
  },
  {
    id: 'projects',
    label: 'Projetos',
    group: 'Organização',
    maturity: 'simulated',
    icon: FolderKanban,
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    group: 'Organização',
    maturity: 'simulated',
    icon: Library,
  },
  {
    id: 'training',
    label: 'Modo Treino',
    group: 'Organização',
    maturity: 'simulated',
    icon: Dumbbell,
  },
  {
    id: 'automations',
    label: 'Automações',
    group: 'Sistema',
    maturity: 'simulated',
    icon: Workflow,
  },
  {
    id: 'integrations',
    label: 'Integrações',
    group: 'Sistema',
    maturity: 'planned',
    icon: Plug,
  },
  {
    id: 'settings',
    label: 'Configurações',
    group: 'Sistema',
    maturity: 'implemented',
    icon: Settings,
  },
];

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userName: string;
  userEmail: string;
}

export function Sidebar({
  activeModule,
  onSelectModule,
  mobileOpen,
  onCloseMobile,
  userName,
  userEmail,
}: SidebarProps) {
  const groups: Array<NavItemConfig['group']> = ['Núcleo', 'Organização', 'Sistema'];

  const handleSelect = (id: ModuleId) => {
    onSelectModule(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-edge w-64 shrink-0 transition-colors duration-200">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-edge">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-accent-text"
          >
            <rect
              x="1.5"
              y="1.5"
              width="25"
              height="25"
              rx="6"
              stroke="currentColor"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
            <circle cx="14" cy="14" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="2" fill="currentColor" />
          </svg>
          <span className="font-display text-lg font-semibold tracking-wider text-ink whitespace-nowrap">
            D.A.R.V.I.S.
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar menu lateral"
          className="lg:hidden p-2 text-ink-muted hover:text-ink rounded-md focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <div className="px-3 mb-2 text-xs font-medium text-ink-subtle">
              {group}
            </div>
            <ul className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent ${
                        isActive
                          ? 'bg-accent-soft text-accent-text border border-accent-soft-border'
                          : 'text-ink-muted hover:text-ink hover:bg-hover-surface border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-accent-text' : 'text-ink-subtle'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.maturity === 'planned' && (
                        <span className="text-[11px] text-ink-subtle shrink-0">
                          Fase 4+
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile footer */}
      <div className="p-4 border-t border-edge">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-inset border border-edge-strong flex items-center justify-center text-xs font-semibold text-accent-text shrink-0">
            DR
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{userName}</p>
            <p className="text-xs text-ink-subtle truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0">{navContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}
