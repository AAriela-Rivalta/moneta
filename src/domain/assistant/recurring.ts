import { SYSTEM_CATEGORY } from '@/config/constants';
import { daysInMonth, monthDiff, monthRange, pad, shiftMonth } from '@/lib/dates';
import { average, median, standardDeviation } from '@/lib/math';
import type { Category, MonthKey, Transaction } from '@/types/finance';
import { normalizeText } from '../transactions';
import type { RecurringExpense } from './types';

export interface RecurringOptions {
  /** Meses hacia atrás que se analizan (incluye el mes de referencia). */
  lookbackMonths?: number;
  /** Cantidad mínima de meses distintos en los que debe aparecer el gasto. */
  minMonths?: number;
  /** Variación máxima tolerada entre los montos mensuales (0.2 = 20%). */
  maxVariation?: number;
}

/** Normaliza la descripción para agrupar variantes: "Factura de luz 03/24" ≈ "factura de luz". */
export function normalizeDescription(description: string): string {
  return normalizeText(description)
    .replace(/[\d.,:;#\-_/()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function recurringKey(tx: Pick<Transaction, 'description' | 'categoryId'>): string {
  return `${normalizeDescription(tx.description)}|${tx.categoryId}`;
}

/**
 * Detecta gastos recurrentes mensuales:
 * 1. Agrupa los gastos por descripción normalizada + categoría.
 * 2. Exige presencia en al menos `minMonths` meses distintos, ~1 aparición por mes y regularidad
 *    (presente en el 75% de los meses desde que apareció por primera vez).
 * 3. Exige montos estables (coeficiente de variación ≤ `maxVariation`).
 * 4. Exige que siga activo (última aparición en el mes de referencia o el anterior).
 */
export function detectRecurringExpenses(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  referenceMonth: MonthKey,
  options: RecurringOptions = {},
): RecurringExpense[] {
  const { lookbackMonths = 6, minMonths = 3, maxVariation = 0.2 } = options;
  const firstMonth = monthRange(referenceMonth, lookbackMonths)[0];
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.categoryId === SYSTEM_CATEGORY.savings) continue;
    const month = tx.date.slice(0, 7);
    if (month < firstMonth || month > referenceMonth) continue;
    const key = recurringKey(tx);
    if (!key.startsWith('|')) groups.set(key, [...(groups.get(key) ?? []), tx]);
  }

  const results: RecurringExpense[] = [];

  for (const [key, txs] of groups) {
    const byMonth = new Map<MonthKey, number>();
    for (const tx of txs) {
      const month = tx.date.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + tx.amount);
    }
    if (byMonth.size < minMonths) continue;
    // Aproximadamente una aparición por mes (descarta compras frecuentes como el supermercado).
    if (txs.length / byMonth.size > 1.5) continue;
    // Regularidad: debe aparecer en al menos el 75% de los meses desde su primera aparición.
    const firstSeen = [...byMonth.keys()].sort()[0];
    if (byMonth.size / (monthDiff(firstSeen, referenceMonth) + 1) < 0.75) continue;

    const amounts = [...byMonth.values()];
    const mean = average(amounts);
    const variation = mean > 0 ? standardDeviation(amounts) / mean : 1;
    if (variation > maxVariation) continue;

    const latest = txs.reduce((last, tx) => (tx.date > last.date ? tx : last));
    if (monthDiff(latest.date.slice(0, 7), referenceMonth) > 1) continue;

    const typicalDay = Math.round(median(txs.map((tx) => Number(tx.date.slice(8, 10)))));
    const paidThisMonth = byMonth.has(referenceMonth);
    const nextMonth = paidThisMonth ? shiftMonth(referenceMonth, 1) : referenceMonth;
    const category = categories.get(latest.categoryId);

    results.push({
      key,
      description: latest.description,
      categoryId: latest.categoryId,
      categoryName: category?.name ?? 'Sin categoría',
      color: category?.color ?? '#a3a9b1',
      icon: category?.icon ?? 'more',
      averageAmount: Math.round(mean),
      monthsDetected: byMonth.size,
      variation: variation * 100,
      lastDate: latest.date,
      nextDate: `${nextMonth}-${pad(Math.min(typicalDay, daysInMonth(nextMonth)))}`,
      paidThisMonth,
    });
  }

  return results.sort((a, b) => b.averageAmount - a.averageAmount);
}
