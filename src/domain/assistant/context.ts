import { SYSTEM_CATEGORY } from '@/config/constants';
import { daysInMonth, getMonthLabel, shiftMonth } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import type { AppData, Category, ISODate, MonthKey, Transaction } from '@/types/finance';
import { getBudgetStatuses, type BudgetStatus } from '../budgets';
import {
  compareCategories,
  getAverageMonthlyExpense,
  getAverageMonthlySavingCapacity,
  getCategoryBreakdown,
  getSavingsContributions,
  getSavingsRate,
  getTotals,
  type CategoryBreakdownItem,
  type CategoryComparisonItem,
  type PeriodTotals,
} from '../statistics';
import { getTransactionsInMonth } from '../transactions';
import { detectRecurringExpenses, recurringKey } from './recurring';
import type { MonthProjection, RecurringExpense } from './types';

/** Toda la información precalculada que necesitan las reglas del asistente. */
export interface AnalysisContext {
  data: AppData;
  today: ISODate;
  monthKey: MonthKey;
  previousMonthKey: MonthKey;
  /** "noviembre" o "noviembre de 2025" si no es el año en curso. */
  monthLabel: string;
  previousMonthLabel: string;
  isCurrentMonth: boolean;
  dayOfMonth: number;
  daysInMonth: number;
  categories: ReadonlyMap<string, Category>;
  monthTxs: Transaction[];
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
  savingsContributions: number;
  savingsRate: number | null;
  /** Gasto de consumo: gastos sin contar aportes a objetivos de ahorro. */
  consumption: number;
  previousConsumption: number;
  breakdown: CategoryBreakdownItem[];
  categoryComparison: CategoryComparisonItem[];
  budgetStatuses: BudgetStatus[];
  recurring: RecurringExpense[];
  /** Monto mensual estimado de gastos fijos por categoría. */
  fixedByCategory: Map<string, number>;
  projection: MonthProjection | null;
  capacity: number;
  averageExpense: number;
  money: (amount: number) => string;
}

function monthSentenceLabel(monthKey: MonthKey, today: ISODate): string {
  const name = getMonthLabel(monthKey, 'long').toLowerCase();
  return monthKey.slice(0, 4) === today.slice(0, 4) ? name : `${name} de ${monthKey.slice(0, 4)}`;
}

/**
 * Proyección de cierre del mes en curso: los gastos fijos se cuentan una sola vez
 * (pagados + pendientes) y solo la parte variable se extrapola según el ritmo diario.
 */
function projectMonth(
  monthTxs: Transaction[],
  totals: PeriodTotals,
  consumption: number,
  savings: number,
  recurring: RecurringExpense[],
  dayOfMonth: number,
  totalDays: number,
): MonthProjection {
  const recurringKeys = new Set(recurring.map((item) => item.key));
  const fixedPaid = monthTxs
    .filter((tx) => tx.type === 'expense' && recurringKeys.has(recurringKey(tx)))
    .reduce((total, tx) => total + tx.amount, 0);
  const fixedPending = recurring.filter((item) => !item.paidThisMonth).reduce((total, item) => total + item.averageAmount, 0);
  const variableSoFar = Math.max(0, consumption - fixedPaid);
  const projectedVariable = (variableSoFar / dayOfMonth) * totalDays;
  const expense = fixedPaid + fixedPending + projectedVariable + savings;
  return { expense: Math.round(expense), balance: Math.round(totals.income - expense) };
}

export function buildAnalysisContext(data: AppData, monthKey: MonthKey, today: ISODate): AnalysisContext {
  const categories = new Map(data.categories.map((category) => [category.id, category]));
  const previousMonthKey = shiftMonth(monthKey, -1);
  const monthTxs = getTransactionsInMonth(data.transactions, monthKey);
  const previousTxs = getTransactionsInMonth(data.transactions, previousMonthKey);

  const totals = getTotals(monthTxs);
  const previousTotals = getTotals(previousTxs);
  const savingsContributions = getSavingsContributions(monthTxs);
  const previousSavings = getSavingsContributions(previousTxs);
  const consumption = totals.expense - savingsContributions;

  const isCurrentMonth = monthKey === today.slice(0, 7);
  const totalDays = daysInMonth(monthKey);
  const dayOfMonth = isCurrentMonth ? Number(today.slice(8, 10)) : totalDays;

  const recurring = detectRecurringExpenses(data.transactions, categories, monthKey);
  const fixedByCategory = new Map<string, number>();
  for (const item of recurring) fixedByCategory.set(item.categoryId, (fixedByCategory.get(item.categoryId) ?? 0) + item.averageAmount);

  const withoutSavings = (txs: Transaction[]) => txs.filter((tx) => tx.categoryId !== SYSTEM_CATEGORY.savings);

  return {
    data,
    today,
    monthKey,
    previousMonthKey,
    monthLabel: monthSentenceLabel(monthKey, today),
    previousMonthLabel: monthSentenceLabel(previousMonthKey, today),
    isCurrentMonth,
    dayOfMonth,
    daysInMonth: totalDays,
    categories,
    monthTxs,
    totals,
    previousTotals,
    savingsContributions,
    savingsRate: getSavingsRate(totals, savingsContributions),
    consumption,
    previousConsumption: previousTotals.expense - previousSavings,
    breakdown: getCategoryBreakdown(monthTxs, categories, 'expense', { excludeSavings: true }),
    categoryComparison: compareCategories(withoutSavings(monthTxs), withoutSavings(previousTxs), categories, 'expense'),
    budgetStatuses: getBudgetStatuses(data.budgets, data.transactions, categories, monthKey, today),
    recurring,
    fixedByCategory,
    projection:
      isCurrentMonth && dayOfMonth < totalDays && totals.count > 0
        ? projectMonth(monthTxs, totals, consumption, savingsContributions, recurring, dayOfMonth, totalDays)
        : null,
    capacity: getAverageMonthlySavingCapacity(data.transactions, monthKey),
    averageExpense: getAverageMonthlyExpense(data.transactions, monthKey),
    // En los mensajes del asistente los montos derivados se muestran redondeados.
    money: (amount: number) => formatCurrency(Math.round(amount), data.settings.currency),
  };
}
