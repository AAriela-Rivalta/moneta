import { BUDGET_LIMIT_PERCENT, BUDGET_WARNING_PERCENT } from '@/config/constants';
import { daysInMonth, monthRange, shiftMonth } from '@/lib/dates';
import { createId } from '@/lib/id';
import { average, percentOf, roundUpNice } from '@/lib/math';
import type { Budget, Category, ISODate, MonthKey, Transaction } from '@/types/finance';

export type BudgetLevel = 'ok' | 'warning' | 'exceeded';

export interface BudgetStatus {
  budget: Budget;
  category: Category | undefined;
  spent: number;
  remaining: number;
  percentage: number;
  level: BudgetLevel;
  /** Monto diario disponible hasta fin de mes (solo para el mes en curso). */
  dailyAllowance: number | null;
  daysLeft: number | null;
}

/** ok < 80% ≤ warning ≤ 100% < exceeded */
export function getBudgetLevel(percentage: number): BudgetLevel {
  if (percentage > BUDGET_LIMIT_PERCENT) return 'exceeded';
  if (percentage >= BUDGET_WARNING_PERCENT) return 'warning';
  return 'ok';
}

export function getBudgetLevelLabel(status: Pick<BudgetStatus, 'level' | 'percentage'>): string {
  if (status.level === 'exceeded') return 'Excedido';
  if (status.level === 'warning') return status.percentage >= BUDGET_LIMIT_PERCENT ? 'Agotado' : 'Cerca del límite';
  return 'En orden';
}

export function getSpentByCategory(transactions: readonly Transaction[], monthKey: MonthKey): Map<string, number> {
  const spent = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.date.startsWith(monthKey)) continue;
    spent.set(tx.categoryId, (spent.get(tx.categoryId) ?? 0) + tx.amount);
  }
  return spent;
}

export function getBudgetStatuses(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  monthKey: MonthKey,
  today: ISODate,
): BudgetStatus[] {
  const spentByCategory = getSpentByCategory(transactions, monthKey);
  const isCurrentMonth = monthKey === today.slice(0, 7);
  const daysLeft = isCurrentMonth ? daysInMonth(monthKey) - Number(today.slice(8, 10)) + 1 : null;

  return budgets
    .filter((budget) => budget.month === monthKey)
    .map((budget) => {
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      const remaining = budget.limit - spent;
      const percentage = percentOf(spent, budget.limit);
      return {
        budget,
        category: categories.get(budget.categoryId),
        spent,
        remaining,
        percentage,
        level: getBudgetLevel(percentage),
        daysLeft,
        // Redondeado hacia abajo: es un monto orientativo y conservador.
        dailyAllowance: daysLeft && remaining > 0 ? Math.floor(remaining / daysLeft) : null,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export interface BudgetSummary {
  totalLimit: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  warningCount: number;
  exceededCount: number;
}

export function getBudgetSummary(statuses: readonly BudgetStatus[]): BudgetSummary {
  const totalLimit = statuses.reduce((total, status) => total + status.budget.limit, 0);
  const totalSpent = statuses.reduce((total, status) => total + status.spent, 0);
  return {
    totalLimit,
    totalSpent,
    remaining: totalLimit - totalSpent,
    percentage: percentOf(totalSpent, totalLimit),
    warningCount: statuses.filter((status) => status.level === 'warning').length,
    exceededCount: statuses.filter((status) => status.level === 'exceeded').length,
  };
}

/** Presupuestos que alcanzaron el 80% o más, ordenados por consumo. */
export function getBudgetAlerts(statuses: readonly BudgetStatus[]): BudgetStatus[] {
  return statuses.filter((status) => status.level !== 'ok');
}

/** Presupuestos del mes `from` que pueden copiarse a `to` (omite categorías ya presupuestadas). */
export function planBudgetCopy(budgets: readonly Budget[], from: MonthKey, to: MonthKey): Budget[] {
  const existing = new Set(budgets.filter((budget) => budget.month === to).map((budget) => budget.categoryId));
  return budgets
    .filter((budget) => budget.month === from && !existing.has(budget.categoryId))
    .map((budget) => ({ id: createId('bud'), categoryId: budget.categoryId, limit: budget.limit, month: to }));
}

/**
 * Sugiere un límite para una categoría: promedio de gasto de los 3 meses anteriores
 * en los que hubo consumo, redondeado hacia arriba. `null` si no hay historial.
 */
export function suggestBudgetLimit(transactions: readonly Transaction[], categoryId: string, monthKey: MonthKey): number | null {
  const months = monthRange(shiftMonth(monthKey, -1), 3);
  const totals = months
    .map((month) => getSpentByCategory(transactions, month).get(categoryId) ?? 0)
    .filter((amount) => amount > 0);
  if (totals.length === 0) return null;
  return roundUpNice(average(totals));
}
