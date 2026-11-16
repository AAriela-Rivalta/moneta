import type { ISODate, MonthKey } from '@/types/finance';

/**
 * Utilidades de fechas. Las fechas se manejan como strings locales (YYYY-MM-DD)
 * para evitar desfasajes por zona horaria al usar `new Date('YYYY-MM-DD')` (que es UTC).
 */

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const MONTH_SHORT_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;

export const WEEKDAY_SHORT_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

const MS_PER_DAY = 86_400_000;

export const pad = (value: number) => String(value).padStart(2, '0');

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

/** Convierte YYYY-MM-DD a Date a medianoche local. */
export function parseISODate(iso: ISODate): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISODate(value);
  return toISODate(date) === value;
}

export function makeMonthKey(year: number, monthIndex: number): MonthKey {
  const date = new Date(year, monthIndex, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function getMonthKey(value: ISODate | Date): MonthKey {
  if (value instanceof Date) return makeMonthKey(value.getFullYear(), value.getMonth());
  return value.slice(0, 7);
}

export function currentMonthKey(): MonthKey {
  return getMonthKey(new Date());
}

export function isValidMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function parseMonthKey(key: MonthKey): { year: number; monthIndex: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, monthIndex: month - 1 };
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const { year, monthIndex } = parseMonthKey(key);
  return makeMonthKey(year, monthIndex + delta);
}

/** Devuelve `count` meses consecutivos que terminan en `endKey` (orden ascendente). */
export function monthRange(endKey: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, index) => shiftMonth(endKey, index - count + 1));
}

/** Cantidad de meses entre dos claves (to - from). */
export function monthDiff(fromKey: MonthKey, toKey: MonthKey): number {
  const from = parseMonthKey(fromKey);
  const to = parseMonthKey(toKey);
  return (to.year - from.year) * 12 + (to.monthIndex - from.monthIndex);
}

export function daysInMonth(key: MonthKey): number {
  const { year, monthIndex } = parseMonthKey(key);
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getMonthBounds(key: MonthKey): { start: ISODate; end: ISODate } {
  return { start: `${key}-01`, end: `${key}-${pad(daysInMonth(key))}` };
}

export function getMonthLabel(key: MonthKey, style: 'long' | 'short' | 'long-year' | 'short-year' = 'long-year'): string {
  const { year, monthIndex } = parseMonthKey(key);
  switch (style) {
    case 'long':
      return MONTH_NAMES[monthIndex];
    case 'short':
      return MONTH_SHORT_NAMES[monthIndex];
    case 'short-year':
      return `${MONTH_SHORT_NAMES[monthIndex]} ${String(year).slice(2)}`;
    default:
      return `${MONTH_NAMES[monthIndex]} ${year}`;
  }
}

/** Ej.: "16 nov 2026" (medium) · "16/11/2026" (short) · "16 de noviembre de 2026" (long) */
export function formatDate(iso: ISODate, style: 'short' | 'medium' | 'long' | 'day-month' = 'medium'): string {
  if (!isValidISODate(iso)) return iso;
  const [year, month, day] = iso.split('-').map(Number);
  const monthIndex = month - 1;
  switch (style) {
    case 'short':
      return `${pad(day)}/${pad(month)}/${year}`;
    case 'long':
      return `${day} de ${MONTH_NAMES[monthIndex].toLowerCase()} de ${year}`;
    case 'day-month':
      return `${day} ${MONTH_SHORT_NAMES[monthIndex].toLowerCase()}`;
    default:
      return `${day} ${MONTH_SHORT_NAMES[monthIndex].toLowerCase()} ${year}`;
  }
}

/** Diferencia en días calendario entre dos fechas (to - from). */
export function diffInDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / MS_PER_DAY);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Suma meses respetando el último día del mes (31/01 + 1 mes = 28/02). */
export function addMonths(iso: ISODate, months: number): ISODate {
  const date = parseISODate(iso);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toISODate(target);
}

/** Índice de día de semana con lunes = 0. */
export function getWeekdayIndex(iso: ISODate): number {
  return (parseISODate(iso).getDay() + 6) % 7;
}
