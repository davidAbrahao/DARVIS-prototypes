import { CheckCircle2, Clock, FlaskConical } from 'lucide-react';
import type { FeatureMaturity } from '../types/darvis';

interface MaturityTagProps {
  maturity: FeatureMaturity;
  labelOverride?: string;
}

export function MaturityTag({ maturity, labelOverride }: MaturityTagProps) {
  if (maturity === 'implemented') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{labelOverride ?? 'Implementado'}</span>
      </span>
    );
  }

  if (maturity === 'simulated') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 [[data-theme=minimalist-light]_&]:text-amber-700 whitespace-nowrap shrink-0">
        <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{labelOverride ?? 'Simulado (Demo)'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted whitespace-nowrap shrink-0">
      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{labelOverride ?? 'Planejado'}</span>
    </span>
  );
}
