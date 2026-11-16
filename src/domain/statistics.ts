import { SYSTEM_CATEGORY } from '@/config/constants';
import { CHART_COLORS } from '@/config/palette';
import { getMonthBounds, getMonthLabel, getWeekdayIndex, monthRange, shiftMonth, WEEKDAY_SHORT_NAMES } from '@/lib/dates';
import { percentChange, percentOf } from '@/lib/math';
import type { IconName } from '@/config/icons';
import type { Category, ISODate, MonthKey, Transaction, TransactionType } from '@/types/finance';
import { getTransactionsInMonth, signedAmount } from './transactions';

/**
 * Cálculos estadísticos centralizados. Todas las pantallas (dashboard, estadísticas,
 * presupuestos y asistente) consumen estas funciones para no duplicar lógica.
 */

export interface PeriodTotals {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export function getTotals(transactions: readonly Transaction[]): PeriodTotals {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, balance: income - expense, count: transactions.length };
}

export function getMonthTotals(transactions: readonly Transaction[], monthKey: MonthKey): PeriodTotals {
  return getTotals(getTransactionsInMonth(transactions, monthKey));
}

/** Saldo acumulado de todos los movimientos hasta una fecha (inclusive). */
export function getBalanceAt(transactions: readonly Transaction[], date: ISODate): number {
  let balance = 0;
  for (const tx of transactions) if (tx.date <= date) balance += signedAmount(tx);
  return balance;
}

export function getMonthEndBalance(transactions: readonly Transaction[], monthKey: MonthKey): number {
  return getBalanceAt(transactions, getMonthBounds(monthKey).end);
}

/** Aportes del período a la categoría de sistema "Ahorro". */
export function getSavingsContributions(transactions: readonly Transaction[]): number {
  let total = 0;
  for (const tx of transactions) if (tx.type === 'expense' && tx.categoryId === SYSTEM_CATEGORY.savings) total += tx.amount;
  return total;
}

/**
 * Porcentaje de los ingresos destinado al ahorro:
 * (lo que sobra del mes + lo transferido explícitamente a objetivos) / ingresos.
 * `null` si no hubo ingresos.
 */
export function getSavingsRate(totals: PeriodTotals, savingsContributions: number): number | null {
  if (totals.income <= 0) return null;
  return percentOf(totals.balance + savingsContributions, totals.income);
}

/* ------------------------------------------------------------------ */
/* Series mensuales                                                     */
/* ------------------------------------------------------------------ */

export interface MonthlyPoint {
  monthKey: MonthKey;
  label: string;
  income: number;
  expense: number;
  balance: number;
  savings: number;
  savingsRate: number | null;
  /** Saldo acumulado al cierre del mes. */
  cumulativeBalance: number;
}

export function getMonthlySeries(transactions: readonly Transaction[], endMonthKey: MonthKey, count: number): MonthlyPoint[] {
  const months = monthRange(endMonthKey, count);
  const firstMonth = months[0];
  const buckets = new Map<MonthKey, Transaction[]>(months.map((key) => [key, []]));
  let openingBalance = 0;

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    if (key < firstMonth) openingBalance += signedAmount(tx);
    else buckets.get(key)?.push(tx);
  }

  let running = openingBalance;
  return months.map((monthKey) => {
    const monthTxs = buckets.get(monthKey) ?? [];
    const totals = getTotals(monthTxs);
    const savings = getSavingsContributions(monthTxs);
    running += totals.balance;
    return {
      monthKey,
      label: getMonthLabel(monthKey, 'short-year'),
      income: totals.income,
      expense: totals.expense,
      balance: totals.balance,
      savings,
      savingsRate: getSavingsRate(totals, savings),
      cumulativeBalance: running,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Distribución por categoría                                          */
/* ------------------------------------------------------------------ */

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: IconName;
  amount: number;
  percentage: number;
  count: number;
}

const UNKNOWN_CATEGORY = { name: 'Sin categoría', color: CHART_COLORS.other, icon: 'more' as IconName };

export function getCategoryBreakdown(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  type: TransactionType = 'expense',
  options: { excludeSavings?: boolean } = {},
): CategoryBreakdownItem[] {
  const totals = new Map<string, { amount: number; count: number }>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    if (options.excludeSavings && tx.categoryId === SYSTEM_CATEGORY.savings) continue;
    const entry = totals.get(tx.categoryId) ?? { amount: 0, count: 0 };
    entry.amount += tx.amount;
    entry.count += 1;
    totals.set(tx.categoryId, entry);
    grandTotal += tx.amount;
  }

  return [...totals.entries()]
    .map(([categoryId, { amount, count }]) => {
      const category = categories.get(categoryId) ?? UNKNOWN_CATEGORY;
      return {
        categoryId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        amount,
        count,
        percentage: percentOf(amount, grandTotal),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Agrupa las categorías menores en "Otras" para gráficos de torta legibles (máx. `maxItems` + 1). */
export function groupMinorCategories(items: readonly CategoryBreakdownItem[], maxItems = 5): CategoryBreakdownItem[] {
  if (items.length <= maxItems + 1) return [...items];
  const main = items.slice(0, maxItems);
  const rest = items.slice(maxItems);
  const restAmount = rest.reduce((total, item) => total + item.amount, 0);
  return [
    ...main,
    {
      categoryId: '__others__',
      name: `Otras (${rest.length})`,
      color: CHART_COLORS.other,
      icon: 'more',
      amount: restAmount,
      count: rest.reduce((total, item) => total + item.count, 0),
      percentage: rest.reduce((total, item) => total + item.percentage, 0),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Comparaciones entre períodos                                         */
/* ------------------------------------------------------------------ */

export interface MonthComparison {
  current: PeriodTotals;
  previous: PeriodTotals;
  previousMonthKey: MonthKey;
  changes: { income: number | null; expense: number | null; balance: number | null };
}

export function compareWithPreviousMonth(transactions: readonly Transaction[], monthKey: MonthKey): MonthComparison {
  const previousMonthKey = shiftMonth(monthKey, -1);
  const current = getMonthTotals(transactions, monthKey);
  const previous = getMonthTotals(transactions, previousMonthKey);
  return {
    current,
    previous,
    previousMonthKey,
    changes: {
      income: percentChange(current.income, previous.income),
      expense: percentChange(current.expense, previous.expense),
      balance: percentChange(current.balance, previous.balance),
    },
  };
}

export interface CategoryComparisonItem {
  categoryId: string;
  name: string;
  color: string;
  icon: IconName;
  current: number;
  previous: number;
  difference: number;
  change: number | null;
}

/** Compara el total de cada categoría entre dos conjuntos de movimientos (dos períodos). */
export function compareCategories(
  currentTxs: readonly Transaction[],
  previousTxs: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  type: TransactionType = 'expense',
): CategoryComparisonItem[] {
  const current = getCategoryBreakdown(currentTxs, categories, type);
  const previous = getCategoryBreakdown(previousTxs, categories, type);
  const ids = new Set([...current, ...previous].map((item) => item.categoryId));

  return [...ids]
    .map((categoryId) => {
      const a = current.find((item) => item.categoryId === categoryId);
      const b = previous.find((item) => item.categoryId === categoryId);
      const info = a ?? b!;
      const currentAmount = a?.amount ?? 0;
      const previousAmount = b?.amount ?? 0;
      return {
        categoryId,
        name: info.name,
        color: info.color,
        icon: info.icon,
        current: currentAmount,
        previous: previousAmount,
        difference: currentAmount - previousAmount,
        change: percentChange(currentAmount, previousAmount),
      };
    })
    .sort((x, y) => Math.max(y.current, y.previous) - Math.max(x.current, x.previous));
}

/* ------------------------------------------------------------------ */
/* Otros indicadores                                                    */
/* ------------------------------------------------------------------ */

export function getTransactionsInRange(transactions: readonly Transaction[], fromMonth: MonthKey, toMonth: MonthKey): Transaction[] {
  const from = getMonthBounds(fromMonth).start;
  const to = getMonthBounds(toMonth).end;
  return transactions.filter((tx) => tx.date >= from && tx.date <= to);
}

export interface WeekdayPoint {
  day: string;
  amount: number;
  count: number;
}

export function getWeekdayExpenses(transactions: readonly Transaction[]): WeekdayPoint[] {
  const points: WeekdayPoint[] = WEEKDAY_SHORT_NAMES.map((day) => ({ day, amount: 0, count: 0 }));
  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.categoryId === SYSTEM_CATEGORY.savings) continue;
    const point = points[getWeekdayIndex(tx.date)];
    point.amount += tx.amount;
    point.count += 1;
  }
  return points;
}

/**
 * Capacidad de ahorro mensual promedio: (ingresos - gastos + aportes a ahorro)
 * de los últimos `months` meses completos con movimientos, anteriores a `monthKey`.
 */
export function getAverageMonthlySavingCapacity(transactions: readonly Transaction[], monthKey: MonthKey, months = 3): number {
  const series = getMonthlySeries(transactions, shiftMonth(monthKey, -1), months).filter((point) => point.income > 0 || point.expense > 0);
  if (series.length === 0) return 0;
  return Math.round(series.reduce((total, point) => total + point.balance + point.savings, 0) / series.length);
}

/** Gasto mensual promedio (sin aportes de ahorro) de los meses completos anteriores. */
export function getAverageMonthlyExpense(transactions: readonly Transaction[], monthKey: MonthKey, months = 3): number {
  const series = getMonthlySeries(transactions, shiftMonth(monthKey, -1), months).filter((point) => point.expense > 0);
  if (series.length === 0) return 0;
  return Math.round(series.reduce((total, point) => total + point.expense - point.savings, 0) / series.length);
}

/** Quita los meses iniciales sin movimientos (conserva al menos `minPoints` puntos). */
export function trimLeadingEmptyMonths(series: MonthlyPoint[], minPoints = 2): MonthlyPoint[] {
  const firstWithData = series.findIndex((point) => point.income > 0 || point.expense > 0);
  if (firstWithData <= 0) return series;
  return series.slice(Math.min(firstWithData, series.length - minPoints));
}
