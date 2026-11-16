import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  daysInMonth,
  diffInDays,
  formatDate,
  getMonthBounds,
  getWeekdayIndex,
  isValidISODate,
  monthDiff,
  monthRange,
  shiftMonth,
} from './dates';

describe('shiftMonth', () => {
  it('avanza y retrocede meses cruzando el cambio de año', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-11', -13)).toBe('2025-10');
  });
});

describe('monthRange', () => {
  it('devuelve meses consecutivos en orden ascendente que terminan en el mes indicado', () => {
    expect(monthRange('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});

describe('monthDiff', () => {
  it('cuenta los meses entre dos claves', () => {
    expect(monthDiff('2025-11', '2026-02')).toBe(3);
    expect(monthDiff('2026-02', '2025-11')).toBe(-3);
  });
});

describe('daysInMonth y getMonthBounds', () => {
  it('tiene en cuenta los años bisiestos', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2026-11')).toBe(30);
  });

  it('devuelve el primer y el último día del mes', () => {
    expect(getMonthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });
});

describe('isValidISODate', () => {
  it('acepta fechas reales en formato YYYY-MM-DD', () => {
    expect(isValidISODate('2026-11-16')).toBe(true);
    expect(isValidISODate('2024-02-29')).toBe(true);
  });

  it('rechaza fechas inexistentes o con otro formato', () => {
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('16/11/2026')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });
});

describe('aritmética de fechas', () => {
  it('diffInDays cuenta días calendario', () => {
    expect(diffInDays('2026-11-16', '2026-12-25')).toBe(39);
    expect(diffInDays('2026-03-01', '2026-02-01')).toBe(-28);
  });

  it('addDays cruza meses y años', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('addMonths respeta el último día del mes', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-11-16', 3)).toBe('2027-02-16');
  });
});

describe('getWeekdayIndex', () => {
  it('numera los días con el lunes como 0', () => {
    expect(getWeekdayIndex('2026-11-16')).toBe(0); // lunes
    expect(getWeekdayIndex('2026-11-22')).toBe(6); // domingo
  });
});

describe('formatDate', () => {
  it('formatea en español en los distintos estilos', () => {
    expect(formatDate('2026-11-16', 'short')).toBe('16/11/2026');
    expect(formatDate('2026-11-16', 'medium')).toBe('16 nov 2026');
    expect(formatDate('2026-11-16', 'long')).toBe('16 de noviembre de 2026');
  });
});
