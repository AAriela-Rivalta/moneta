import { SYSTEM_CATEGORY } from '@/config/constants';
import { isValidISODate, pad } from '@/lib/dates';
import { roundMoney } from '@/lib/math';
import type { ISODate, Transaction } from '@/types/finance';
import { normalizeDescription } from './assistant/recurring';
import { normalizeText } from './transactions';
import { parseAmount } from './validation';

/**
 * Lectura de tickets: a partir del texto ya reconocido, propone comercio, monto y fecha.
 * No guarda la foto ni modifica los movimientos.
 */
export interface ReceiptDraft {
  merchant: string | null;
  amount: number | null;
  date: ISODate | null;
}

const TOTAL_LINE = /\b(total|a pagar)\b/;
const SKIP_MERCHANT =
  /\b(cuit|iva|fecha|ticket|factura|domicilio|direccion|total|pago|cambio|efectivo|tarjeta|consumidor|condicion|punto|nro|numero|subtotal|importe|caja|hora|tel|telefono|comprobante|fiscal|afip|cae|vencimiento|original|duplicado|triplicado|gracias|vuelva|www|http)\b/;

function datePattern(): RegExp {
  return /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/g;
}

function cuitPattern(): RegExp {
  return /\b\d{2}-?\d{8}-?\d\b/g;
}

/** Montos con separadores locales, o enteros de hasta 6 dígitos. No recorta un número más largo. */
function moneyPattern(): RegExp {
  return /(?<![\d.,])(?:\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+,\d{1,2}|\d+\.\d{1,2}|\d{1,6})(?![\d.,])/g;
}

function expandYear(year: number): number {
  if (year >= 100) return year;
  return year < 70 ? 2000 + year : 1900 + year;
}

function parseReceiptDate(text: string): ISODate | null {
  for (const match of text.matchAll(datePattern())) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = expandYear(Number(match[3]));
    if (year < 2000 || year > 2100) continue;
    const iso = `${year}-${pad(month)}-${pad(day)}`;
    if (isValidISODate(iso)) return iso;
  }
  return null;
}

function lineAmounts(line: string): number[] {
  const cleaned = line
    .replace(datePattern(), ' ')
    .replace(cuitPattern(), ' ')
    .replace(/(\d)\s+(?=\d)/g, '$1');
  const amounts: number[] = [];
  for (const match of cleaned.matchAll(moneyPattern())) {
    const amount = parseAmount(match[1] ?? '');
    if (!Number.isFinite(amount) || amount <= 0) continue;
    amounts.push(roundMoney(amount));
  }
  return amounts;
}

function isTotalLine(line: string): boolean {
  const normalized = normalizeText(line);
  if (normalized.includes('subtotal')) return false;
  return TOTAL_LINE.test(normalized);
}

function findMerchant(lines: readonly string[]): string | null {
  for (const line of lines) {
    const letters = line.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
    if (letters.length < 3) continue;
    if (SKIP_MERCHANT.test(normalizeText(line))) continue;
    return line.replace(/\s+/g, ' ').slice(0, 80);
  }
  return null;
}

export function parseReceiptText(text: string): ReceiptDraft {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let totalAmount: number | null = null;
  let maxAmount: number | null = null;

  for (const line of lines) {
    const amounts = lineAmounts(line);
    for (const amount of amounts) {
      if (maxAmount === null || amount > maxAmount) maxAmount = amount;
    }
    if (isTotalLine(line) && amounts.length > 0) {
      totalAmount = amounts[amounts.length - 1] ?? null;
    }
  }

  return {
    merchant: findMerchant(lines),
    amount: totalAmount ?? maxAmount,
    date: parseReceiptDate(text),
  };
}

/** Monto listo para el campo del formulario: coma decimal y sin miles. */
export function amountToField(amount: number): string {
  const [whole, fraction] = roundMoney(amount).toFixed(2).split('.');
  return fraction === '00' ? whole : `${whole},${fraction}`;
}

function words(value: string): string[] {
  return normalizeDescription(value)
    .split(' ')
    .filter((word) => word.length >= 4);
}

/**
 * Sugiere una categoría de gasto si el comercio comparte una palabra con gastos ya cargados.
 * Si hay empate entre categorías, no sugiere ninguna.
 */
export function suggestCategoryId(
  merchant: string,
  transactions: readonly Pick<Transaction, 'description' | 'categoryId' | 'type'>[],
): string | null {
  const merchantWords = new Set(words(merchant));
  if (merchantWords.size === 0) return null;

  const counts = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || transaction.categoryId === SYSTEM_CATEGORY.savings) continue;
    const shares = words(transaction.description).some((word) => merchantWords.has(word));
    if (!shares) continue;
    counts.set(transaction.categoryId, (counts.get(transaction.categoryId) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;
  let tied = false;
  for (const [categoryId, count] of counts) {
    if (count > bestCount) {
      best = categoryId;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }
  return tied ? null : best;
}
