import type { CurrencyCode } from '@/types/finance';

const LOCALE = 'es-AR';
const cache = new Map<string, Intl.NumberFormat>();

function getFormatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, options);
    cache.set(key, formatter);
  }
  return formatter;
}

export interface CurrencyFormatOptions {
  /** Notación compacta: "$ 1,2 M". Útil para ejes de gráficos. */
  compact?: boolean;
  /** Muestra siempre el signo (+/-). */
  signed?: boolean;
}

export function formatCurrency(amount: number, currency: CurrencyCode, options: CurrencyFormatOptions = {}): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const { compact = false, signed = false } = options;
  const hasDecimals = !compact && Math.round(safeAmount * 100) % 100 !== 0;
  const fractionDigits = compact ? 1 : hasDecimals ? 2 : 0;
  const key = `${currency}|${compact}|${signed}|${fractionDigits}`;

  return getFormatter(key, {
    style: 'currency',
    currency,
    // "symbol" distingue monedas que comparten "$" (ARS: $, USD: US$, MXN: MX$).
    currencyDisplay: 'symbol',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: compact ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(safeAmount);
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return getFormatter(`number|${maximumFractionDigits}`, { maximumFractionDigits }).format(value);
}

/** Recibe un porcentaje ya calculado (ej.: 23.5) y devuelve "23,5 %". */
export function formatPercent(value: number, maximumFractionDigits = 0, signed = false): string {
  const formatted = getFormatter(`percent|${maximumFractionDigits}|${signed}`, {
    maximumFractionDigits,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(value);
  return `${formatted}%`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
