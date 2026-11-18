import { percentChange, percentOf } from '@/lib/math';
import type { AppData, ISODate, MonthKey } from '@/types/finance';
import { buildAnalysisContext } from './context';
import { computeHealthScore } from './healthScore';
import { ASSISTANT_RULES } from './rules';
import type { AssistantReport, Insight, InsightSeverity } from './types';

export { ASSISTANT_RULES } from './rules';
export type * from './types';

const SEVERITY_ORDER: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };

/**
 * Motor del asistente financiero: construye un contexto de análisis con los datos reales,
 * ejecuta cada regla y ordena las recomendaciones por severidad.
 */
export function generateAssistantReport(data: AppData, monthKey: MonthKey, today: ISODate): AssistantReport {
  const ctx = buildAnalysisContext(data, monthKey, today);
  const hasData = ctx.totals.count > 0;

  const insights: Insight[] = [];
  if (!hasData) {
    insights.push({
      id: 'no-data',
      severity: 'info',
      topic: 'balance',
      title: `Todavía no hay movimientos en ${ctx.monthLabel}`,
      message: 'Registrá tus ingresos y gastos para que el asistente pueda analizar tus finanzas y generar recomendaciones.',
      action: { label: 'Registrar movimiento', to: '/app/movimientos?nuevo=gasto' },
    });
  }

  for (const rule of ASSISTANT_RULES) {
    // Sin movimientos en el mes solo tienen sentido las reglas de objetivos.
    if (!hasData && rule.id !== 'goals' && rule.id !== 'emergency-fund') continue;
    rule.evaluate(ctx).forEach((result, index) => insights.push({ ...result, id: `${rule.id}-${index}` }));
  }

  insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const recurringTotal = ctx.recurring.reduce((sum, item) => sum + item.averageAmount, 0);

  return {
    monthKey,
    hasData,
    insights,
    recurring: ctx.recurring,
    topCategories: ctx.breakdown.slice(0, 5),
    score: computeHealthScore(ctx),
    projection: ctx.projection,
    metrics: {
      income: ctx.totals.income,
      consumption: ctx.consumption,
      savedAmount: ctx.totals.balance + ctx.savingsContributions,
      savingsRate: ctx.savingsRate,
      consumptionChange: ctx.previousConsumption > 0 ? percentChange(ctx.consumption, ctx.previousConsumption) : null,
      recurringTotal,
      recurringShare: ctx.totals.income > 0 ? percentOf(recurringTotal, ctx.totals.income) : null,
      capacity: ctx.capacity,
    },
  };
}
