import { RECOMMENDED_SAVINGS_RATE } from '@/config/constants';
import { formatPercent } from '@/lib/format';
import { clamp, percentChange, percentOf } from '@/lib/math';
import { getGoalProgress } from '../goals';
import type { AnalysisContext } from './context';
import type { HealthScore, HealthScoreComponent } from './types';

/**
 * Puntaje de salud financiera (0 a 100) compuesto por cuatro dimensiones:
 * ahorro (35), presupuestos (25), tendencia de gasto (20) y objetivos (20).
 */
export function computeHealthScore(ctx: AnalysisContext): HealthScore {
  const components: HealthScoreComponent[] = [savingsComponent(ctx), budgetsComponent(ctx), trendComponent(ctx), goalsComponent(ctx)];
  const total = Math.round(components.reduce((sum, component) => sum + component.score, 0));

  if (total >= 80) return { total, label: 'Excelente', tone: 'success', components };
  if (total >= 60) return { total, label: 'Buena', tone: 'brand', components };
  if (total >= 40) return { total, label: 'Regular', tone: 'warning', components };
  return { total, label: 'En riesgo', tone: 'coral', components };
}

function savingsComponent(ctx: AnalysisContext): HealthScoreComponent {
  const max = 35;
  if (ctx.savingsRate === null) return { key: 'savings', label: 'Ahorro', max, score: 0, detail: 'Sin ingresos registrados en el mes' };
  // A mitad de mes la tasa parcial es optimista (los ingresos llegan antes que los gastos):
  // si hay una proyección confiable, se evalúa la tasa proyectada al cierre.
  const useProjection = ctx.projection !== null && ctx.dayOfMonth >= 5;
  const rate = useProjection ? percentOf(ctx.projection!.balance + ctx.savingsContributions, ctx.totals.income) : ctx.savingsRate;
  const score = clamp((rate / RECOMMENDED_SAVINGS_RATE) * max, 0, max);
  const label = useProjection ? 'Tasa de ahorro proyectada' : 'Tasa de ahorro';
  return { key: 'savings', label: 'Ahorro', max, score, detail: `${label}: ${formatPercent(rate, 1)} (meta ${RECOMMENDED_SAVINGS_RATE}%)` };
}

function budgetsComponent(ctx: AnalysisContext): HealthScoreComponent {
  const max = 25;
  const statuses = ctx.budgetStatuses;
  if (statuses.length === 0) return { key: 'budgets', label: 'Presupuestos', max, score: max / 2, detail: 'Sin presupuestos definidos' };
  const exceeded = statuses.filter((status) => status.level === 'exceeded').length;
  const warning = statuses.filter((status) => status.level === 'warning').length;
  const penalty = (exceeded + warning * 0.4) / statuses.length;
  const healthy = statuses.length - exceeded - warning;
  return {
    key: 'budgets',
    label: 'Presupuestos',
    max,
    score: clamp(max * (1 - penalty), 0, max),
    detail: `${healthy} de ${statuses.length} en orden · ${exceeded} excedidos`,
  };
}

function trendComponent(ctx: AnalysisContext): HealthScoreComponent {
  const max = 20;
  if (ctx.previousConsumption <= 0) return { key: 'trend', label: 'Tendencia de gasto', max, score: max / 2, detail: 'Sin mes anterior para comparar' };
  // En el mes en curso se usa la proyección para no premiar un mes incompleto.
  const current = ctx.projection ? ctx.projection.expense - ctx.savingsContributions : ctx.consumption;
  const change = percentChange(current, ctx.previousConsumption) ?? 0;
  const score = change <= 0 ? max : clamp(max * (1 - change / 30), 0, max);
  const label = ctx.projection ? 'Proyección vs. mes anterior' : 'Gasto vs. mes anterior';
  return { key: 'trend', label: 'Tendencia de gasto', max, score, detail: `${label}: ${formatPercent(change, 1, true)}` };
}

function goalsComponent(ctx: AnalysisContext): HealthScoreComponent {
  const max = 20;
  const goals = ctx.data.goals;
  if (goals.length === 0) return { key: 'goals', label: 'Objetivos', max, score: max / 2, detail: 'Sin objetivos de ahorro' };

  const progress = goals.map((goal) => getGoalProgress(goal, ctx.today));
  const active = progress.filter((item) => item.status === 'active');
  const overdue = progress.filter((item) => item.status === 'overdue').length;
  const overduePenalty = 1 - overdue / goals.length;

  if (active.length === 0) {
    const completed = progress.length - overdue;
    return { key: 'goals', label: 'Objetivos', max, score: max * overduePenalty, detail: `${completed} cumplidos · ${overdue} vencidos` };
  }

  // Qué proporción del ahorro mensual requerido cubre la capacidad de ahorro real.
  const needed = active.reduce((sum, item) => sum + item.monthlyNeeded, 0);
  const coverage = ctx.capacity <= 0 ? 0 : Math.min(1, ctx.capacity / needed);
  return {
    key: 'goals',
    label: 'Objetivos',
    max,
    score: max * coverage * overduePenalty,
    detail: `Tu capacidad cubre el ${formatPercent(coverage * 100)} del ahorro requerido${overdue > 0 ? ` · ${overdue} vencidos` : ''}`,
  };
}
