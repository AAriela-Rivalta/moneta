import { describe, expect, it } from 'vitest';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { categoryMap, expense } from '@/test/factories';
import type { Transaction } from '@/types/finance';
import { detectRecurringExpenses, normalizeDescription } from './recurring';

const categories = categoryMap();
const REFERENCE_MONTH = '2026-11';

/** Un gasto por mes, el mismo día, en cada uno de los meses indicados. */
function monthly(description: string, amounts: number | number[], categoryId: string, months: string[], day = '10'): Transaction[] {
  return months.map((month, index) =>
    expense(Array.isArray(amounts) ? amounts[index] : amounts, `${month}-${day}`, { description, categoryId }),
  );
}

describe('normalizeDescription', () => {
  it('ignora mayúsculas, tildes, números y signos para agrupar variantes', () => {
    expect(normalizeDescription('Factura de Luz 03/24')).toBe('factura de luz');
    expect(normalizeDescription('  Netflix (Premium) ')).toBe('netflix premium');
    expect(normalizeDescription('Café')).toBe('cafe');
  });
});

describe('detectRecurringExpenses', () => {
  const transactions = [
    // Recurrentes
    ...monthly('Netflix', 5_000, 'exp-suscripciones', ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'], '05'),
    expense(20_000, '2026-09-12', { description: 'Factura de luz 09/26', categoryId: 'exp-servicios' }),
    expense(21_000, '2026-10-12', { description: 'Factura de luz 10/26', categoryId: 'exp-servicios' }),
    expense(19_500, '2026-11-12', { description: 'Factura de Luz 11/26', categoryId: 'exp-servicios' }),
    ...monthly('Alquiler', 300_000, 'exp-vivienda', ['2026-07', '2026-08', '2026-09', '2026-10']),
    // No recurrentes
    ...['03', '13', '23'].flatMap((day) => monthly('Supermercado', 15_000, 'exp-supermercado', ['2026-09', '2026-10', '2026-11'], day)),
    ...monthly('Gimnasio', [5_000, 15_000, 30_000], 'exp-salud', ['2026-09', '2026-10', '2026-11']),
    ...monthly('Curso de inglés', 8_000, 'exp-educacion', ['2026-06', '2026-07', '2026-08'], '20'),
    ...monthly('Aporte a vacaciones', 10_000, SYSTEM_CATEGORY.savings, ['2026-09', '2026-10', '2026-11']),
  ];
  const result = detectRecurringExpenses(transactions, categories, REFERENCE_MONTH);
  const find = (name: string) => result.find((item) => item.description.startsWith(name));

  it('detecta solo los gastos fijos mensuales, ordenados por monto', () => {
    expect(result.map((item) => item.description)).toEqual(['Alquiler', 'Factura de Luz 11/26', 'Netflix']);
  });

  it('agrupa descripciones con fechas distintas y tolera pequeñas variaciones de monto', () => {
    expect(find('Factura')).toMatchObject({ averageAmount: 20_167, monthsDetected: 3, categoryName: 'Servicios' });
    expect(find('Factura')!.variation).toBeLessThan(20);
  });

  it('analiza solo los últimos 6 meses', () => {
    // Netflix aparece 7 meses, pero mayo queda fuera de la ventana de análisis.
    expect(find('Netflix')!.monthsDetected).toBe(6);
  });

  it('estima el próximo vencimiento según si ya se pagó este mes', () => {
    expect(find('Netflix')).toMatchObject({ paidThisMonth: true, nextDate: '2026-12-05' });
    expect(find('Alquiler')).toMatchObject({ paidThisMonth: false, nextDate: '2026-11-10' });
  });

  it('descarta compras frecuentes, montos irregulares, gastos que dejaron de pagarse y aportes a Ahorro', () => {
    const descriptions = result.map((item) => item.description);
    expect(descriptions).not.toContain('Supermercado');
    expect(descriptions).not.toContain('Gimnasio');
    expect(descriptions).not.toContain('Curso de inglés');
    expect(descriptions).not.toContain('Aporte a vacaciones');
  });

  it('exige al menos 3 meses', () => {
    const twoMonths = monthly('Spotify', 3_000, 'exp-suscripciones', ['2026-10', '2026-11']);
    expect(detectRecurringExpenses(twoMonths, categories, REFERENCE_MONTH)).toEqual([]);
  });
});
