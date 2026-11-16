import type { BadgeTone } from '@/components/ui/Badge';
import type { ProgressTone } from '@/components/ui/ProgressBar';
import type { BudgetLevel } from '@/domain/budgets';

/** Representación visual de cada nivel de consumo de un presupuesto. */
export const BUDGET_LEVEL_UI: Record<BudgetLevel, { progress: ProgressTone; badge: BadgeTone }> = {
  ok: { progress: 'brand', badge: 'success' },
  warning: { progress: 'warning', badge: 'warning' },
  exceeded: { progress: 'coral', badge: 'coral' },
};
