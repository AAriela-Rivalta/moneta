import type { CurrencyCode } from '@/types/finance';

export const APP_NAME = 'Moneta';

/** Clave única donde se persiste todo el estado de la aplicación. */
export const STORAGE_KEY = 'moneta:data';
export const DATA_VERSION = 1;

/** Umbrales de alerta de presupuestos (en porcentaje de consumo). */
export const BUDGET_WARNING_PERCENT = 80;
export const BUDGET_LIMIT_PERCENT = 100;

/** Objetivo de ahorro recomendado (regla 50/30/20). */
export const RECOMMENDED_SAVINGS_RATE = 20;

export const MAX_AMOUNT = 999_999_999_999;

/** Categorías del sistema: se usan como respaldo y no pueden eliminarse. */
export const SYSTEM_CATEGORY = {
  savings: 'exp-ahorro',
  otherExpense: 'exp-otros',
  otherIncome: 'inc-otros',
} as const;

export const CURRENCIES: ReadonlyArray<{ code: CurrencyCode; label: string }> = [
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'USD', label: 'Dólar estadounidense' },
  { code: 'EUR', label: 'Euro' },
  { code: 'BRL', label: 'Real brasileño' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'UYU', label: 'Peso uruguayo' },
  { code: 'MXN', label: 'Peso mexicano' },
];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value);
}
