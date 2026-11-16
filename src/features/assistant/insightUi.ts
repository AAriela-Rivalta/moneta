import { CircleCheck, Lightbulb, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { InsightSeverity } from '@/domain/assistant';

export const SEVERITY_UI: Record<InsightSeverity, { icon: LucideIcon; label: string; iconClass: string; accent: string }> = {
  critical: { icon: OctagonAlert, label: 'Alerta', iconClass: 'bg-coral-50 text-coral-600', accent: 'text-coral-600' },
  warning: { icon: TriangleAlert, label: 'Atención', iconClass: 'bg-amber-50 text-amber-600', accent: 'text-amber-700' },
  info: { icon: Lightbulb, label: 'Recomendación', iconClass: 'bg-brand-50 text-brand-600', accent: 'text-brand-700' },
  success: { icon: CircleCheck, label: 'Logro', iconClass: 'bg-emerald-50 text-emerald-600', accent: 'text-emerald-700' },
};
