import { Check, Palette } from 'lucide-react';
import type { DarvisTheme } from '../types/darvis';

interface ThemeOption {
  id: DarvisTheme;
  label: string;
  description: string;
  swatches: [string, string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'deep-space',
    label: 'Deep Space',
    description: 'Obsidian profundo & ciano técnico',
    swatches: ['#090C10', '#111622', '#06B6D4'],
  },
  {
    id: 'cyberpunk-neon',
    label: 'Cyberpunk Neon',
    description: 'Violeta noturno & magenta elétrico',
    swatches: ['#070510', '#130B24', '#EC4899'],
  },
  {
    id: 'minimalist-light',
    label: 'Minimalist Light',
    description: 'Superfície clara & contraste limpo',
    swatches: ['#F4F6F9', '#FFFFFF', '#0284C7'],
  },
];

interface ThemeSwitcherWidgetProps {
  currentTheme: DarvisTheme;
  onSelectTheme: (theme: DarvisTheme) => void;
}

export function ThemeSwitcherWidget({
  currentTheme,
  onSelectTheme,
}: ThemeSwitcherWidgetProps) {
  return (
    <section
      aria-label="Alternador de Tema"
      className="rounded-xl bg-surface border border-edge p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent-text shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Alternador de Tema
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Aparência da central de comando
            </p>
          </div>
        </div>
      </div>

      <div role="radiogroup" aria-label="Selecionar tema de cores" className="space-y-2.5">
        {THEME_OPTIONS.map((option) => {
          const isSelected = currentTheme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.label} — ${option.description}`}
              data-theme-option={option.id}
              onClick={() => onSelectTheme(option.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'bg-accent-soft border-accent-soft-border text-ink'
                  : 'bg-inset border-edge text-ink-secondary hover:bg-hover-surface'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className="inline-flex items-center -space-x-1 shrink-0"
                >
                  {option.swatches.map((hex, idx) => (
                    <span
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-edge-strong"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink truncate">
                    {option.label}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {option.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-text shrink-0 whitespace-nowrap">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Ativo</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
