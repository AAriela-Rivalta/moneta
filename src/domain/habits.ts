import { SYSTEM_CATEGORY } from '@/config/constants';
import type { IconName } from '@/config/icons';
import { monthRange } from '@/lib/dates';
import { average, percentOf, roundMoney, standardDeviation, sumBy } from '@/lib/math';
import type { Category, MonthKey, Transaction } from '@/types/finance';
import { normalizeDescription } from './assistant/recurring';
import { getTransactionsInMonth } from './transactions';

/**
 * Hábitos de gasto derivados de los movimientos. Las pantallas solo muestran
 * estos resultados: no vuelven a agrupar ni a clasificar.
 */

/** Meses que terminan en el mes elegido, incluido ese mes. */
export const HABIT_LOOKBACK_MONTHS = 3;

const REPEAT_MIN_COUNT = 4;
/** Estrictamente mayor: es el complemento del detector de recurrentes, que descarta grupos por encima de 1,5. */
const REPEAT_MIN_PER_MONTH = 1.5;
const REPEAT_LIMIT = 5;
const STABILITY_MIN_ACTIVE_MONTHS = 2;
const STABILITY_LIMIT = 8;
const STABLE_MAX = 0.25;
const VARIABLE_MAX = 0.6;

const RHYTHM_BUCKETS = [
  { id: 'start', label: 'Inicio de mes' },
  { id: 'middle', label: 'Medio de mes' },
  { id: 'end', label: 'Cierre de mes' },
] as const;

export type RhythmBucketId = (typeof RHYTHM_BUCKETS)[number]['id'];
export type StabilityLevel = 'stable' | 'variable' | 'irregular';

export interface RhythmBucket {
  id: RhythmBucketId;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthRhythm {
  total: number;
  count: number;
  buckets: RhythmBucket[];
  /** Tramo de mayor gasto. En un empate, el más temprano. `null` si no hubo gastos. */
  dominant: RhythmBucketId | null;
}

export interface RepeatPurchase {
  key: string;
  description: string;
  categoryId: string;
  categoryName: string;
  color: string;
  icon: IconName;
  /** Cantidad de movimientos del grupo. */
  count: number;
  /** Meses distintos de la ventana en los que apareció. */
  monthsActive: number;
  /** Movimientos por mes con actividad (`count / monthsActive`). */
  perMonth: number;
  total: number;
  averageTicket: number;
}

export interface MonthlyAmount {
  monthKey: MonthKey;
  amount: number;
}

export interface CategoryStability {
  categoryId: string;
  name: string;
  color: string;
  icon: IconName;
  /** Un punto por mes de la ventana, en orden. El mes sin gastos vale 0. */
  monthly: MonthlyAmount[];
  mean: number;
  /** Desviación estándar dividida por la media. */
  variation: number;
  level: StabilityLevel;
}

export interface HabitsReport {
  monthKey: MonthKey;
  window: MonthKey[];
  rhythm: MonthRhythm;
  repeats: RepeatPurchase[];
  stability: CategoryStability[];
}

function isConsumptionExpense(tx: Transaction): boolean {
  return tx.type === 'expense' && tx.categoryId !== SYSTEM_CATEGORY.savings;
}

function habitWindow(monthKey: MonthKey): MonthKey[] {
  return monthRange(monthKey, HABIT_LOOKBACK_MONTHS);
}

function rhythmBucketIndex(day: number): number {
  if (day <= 10) return 0;
  if (day <= 20) return 1;
  return 2;
}

function categoryAppearance(categories: ReadonlyMap<string, Category>, categoryId: string): { name: string; color: string; icon: IconName } {
  const category = categories.get(categoryId);
  return {
    name: category?.name ?? 'Sin categoría',
    color: category?.color ?? '#a3a9b1',
    icon: category?.icon ?? 'more',
  };
}

/**
 * Reparte el gasto de consumo del mes en tres tramos: días 1–10, 11–20 y 21 hasta fin de mes.
 * Ingresos y aportes a la categoría Ahorro no entran.
 */
export function getMonthRhythm(transactions: readonly Transaction[], monthKey: MonthKey): MonthRhythm {
  const buckets: RhythmBucket[] = RHYTHM_BUCKETS.map((bucket) => ({ ...bucket, amount: 0, count: 0, percentage: 0 }));

  for (const tx of getTransactionsInMonth(transactions, monthKey)) {
    if (!isConsumptionExpense(tx)) continue;
    const bucket = buckets[rhythmBucketIndex(Number(tx.date.slice(8, 10)))];
    bucket.amount += tx.amount;
    bucket.count += 1;
  }

  const total = sumBy(buckets, (bucket) => bucket.amount);
  for (const bucket of buckets) bucket.percentage = percentOf(bucket.amount, total);

  const peak = Math.max(...buckets.map((bucket) => bucket.amount));
  const dominant = peak > 0 ? (buckets.find((bucket) => bucket.amount === peak)?.id ?? null) : null;

  return { total, count: sumBy(buckets, (bucket) => bucket.count), buckets, dominant };
}

/**
 * Compras que se repiten seguido dentro de los tres meses que terminan en `monthKey`.
 * Agrupa por descripción normalizada y categoría. Entran los grupos con al menos cuatro
 * movimientos y más de 1,5 movimientos por mes en el que hubo actividad.
 */
export function getRepeatPurchases(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  monthKey: MonthKey,
): RepeatPurchase[] {
  const window = new Set(habitWindow(monthKey));
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    if (!isConsumptionExpense(tx) || !window.has(tx.date.slice(0, 7))) continue;
    const normalized = normalizeDescription(tx.description);
    if (!normalized) continue;
    const key = `${normalized}|${tx.categoryId}`;
    const list = groups.get(key);
    if (list) list.push(tx);
    else groups.set(key, [tx]);
  }

  const results: RepeatPurchase[] = [];

  for (const [key, txs] of groups) {
    const count = txs.length;
    const monthsActive = new Set(txs.map((tx) => tx.date.slice(0, 7))).size;
    const perMonth = count / monthsActive;
    if (count < REPEAT_MIN_COUNT || perMonth <= REPEAT_MIN_PER_MONTH) continue;

    const total = sumBy(txs, (tx) => tx.amount);
    const latest = txs.reduce((best, tx) => {
      if (tx.date > best.date || (tx.date === best.date && tx.createdAt > best.createdAt)) return tx;
      return best;
    });
    const appearance = categoryAppearance(categories, latest.categoryId);

    results.push({
      key,
      description: latest.description,
      categoryId: latest.categoryId,
      categoryName: appearance.name,
      color: appearance.color,
      icon: appearance.icon,
      count,
      monthsActive,
      perMonth,
      total,
      averageTicket: roundMoney(total / count),
    });
  }

  return results
    .sort((a, b) => b.count - a.count || b.total - a.total || a.description.localeCompare(b.description, 'es') || a.categoryName.localeCompare(b.categoryName, 'es'))
    .slice(0, REPEAT_LIMIT);
}

/** Clasifica el coeficiente de variación. 0,25 y 0,60 quedan en el nivel inferior. */
export function getStabilityLevel(variation: number): StabilityLevel {
  if (variation <= STABLE_MAX) return 'stable';
  if (variation <= VARIABLE_MAX) return 'variable';
  return 'irregular';
}

/**
 * Mide qué tan parejo fue el gasto de cada categoría en los tres meses que terminan en `monthKey`.
 * Un mes sin movimientos cuenta como 0. Hace falta gasto en al menos dos meses.
 */
export function getCategoryStability(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  monthKey: MonthKey,
): CategoryStability[] {
  const window = habitWindow(monthKey);
  const windowSet = new Set(window);
  const totals = new Map<string, Map<MonthKey, number>>();

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7);
    if (!isConsumptionExpense(tx) || !windowSet.has(month)) continue;
    const byMonth = totals.get(tx.categoryId) ?? new Map<MonthKey, number>();
    byMonth.set(month, (byMonth.get(month) ?? 0) + tx.amount);
    totals.set(tx.categoryId, byMonth);
  }

  const results: CategoryStability[] = [];

  for (const [categoryId, byMonth] of totals) {
    const monthly = window.map((month) => ({ monthKey: month, amount: byMonth.get(month) ?? 0 }));
    const activeMonths = monthly.filter((point) => point.amount > 0).length;
    if (activeMonths < STABILITY_MIN_ACTIVE_MONTHS) continue;

    const values = monthly.map((point) => point.amount);
    const mean = average(values);
    const variation = mean > 0 ? standardDeviation(values) / mean : 0;
    const appearance = categoryAppearance(categories, categoryId);

    results.push({
      categoryId,
      name: appearance.name,
      color: appearance.color,
      icon: appearance.icon,
      monthly,
      mean,
      variation,
      level: getStabilityLevel(variation),
    });
  }

  return results.sort((a, b) => a.variation - b.variation || a.name.localeCompare(b.name, 'es')).slice(0, STABILITY_LIMIT);
}

/** Junta los tres análisis para el mes elegido. No modifica los movimientos recibidos. */
export function buildHabitsReport(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  monthKey: MonthKey,
): HabitsReport {
  return {
    monthKey,
    window: habitWindow(monthKey),
    rhythm: getMonthRhythm(transactions, monthKey),
    repeats: getRepeatPurchases(transactions, categories, monthKey),
    stability: getCategoryStability(transactions, categories, monthKey),
  };
}
