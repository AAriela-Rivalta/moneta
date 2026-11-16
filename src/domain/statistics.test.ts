import { describe, expect, it } from 'vitest';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { categoryMap, expense, income } from '@/test/factories';
import {
  compareWithPreviousMonth,
  getAverageMonthlySavingCapacity,
  getCategoryBreakdown,
  getMonthEndBalance,
  getMonthlySeries,
  getMonthTotals,
  getSavingsRate,
  getWeekdayExpenses,
  groupMinorCategories,
  type CategoryBreakdownItem,
} from './statistics';

const categories = categoryMap();

/**
 * Escenario: saldo inicial de $10.000 en agosto y tres meses de movimientos.
 * - Septiembre: +100.000 −60.000            → balance +40.000
 * - Octubre:    +100.000 −50.000 −30.000    → balance +20.000
 * - Noviembre:  +120.000 −40.000 −20.000 −10.000 (aporte a Ahorro) → balance +50.000
 */
const transactions = [
  income(10_000, '2026-08-31', { description: 'Saldo inicial' }),
  income(100_000, '2026-09-01'),
  expense(60_000, '2026-09-15', { categoryId: 'exp-supermercado' }),
  income(100_000, '2026-10-01'),
  expense(50_000, '2026-10-10', { categoryId: 'exp-supermercado' }),
  expense(30_000, '2026-10-20', { categoryId: 'exp-ocio' }),
  income(120_000, '2026-11-01'),
  expense(40_000, '2026-11-05', { categoryId: 'exp-supermercado' }),
  expense(20_000, '2026-11-08', { categoryId: 'exp-transporte' }),
  expense(10_000, '2026-11-09', { categoryId: SYSTEM_CATEGORY.savings }),
];
const november = transactions.filter((tx) => tx.date.startsWith('2026-11'));

describe('totales del mes', () => {
  it('suma ingresos y gastos y calcula el balance', () => {
    expect(getMonthTotals(transactions, '2026-11')).toEqual({ income: 120_000, expense: 70_000, balance: 50_000, count: 4 });
  });

  it('la tasa de ahorro incluye lo que sobra y lo aportado a objetivos', () => {
    const totals = getMonthTotals(transactions, '2026-11');
    // (50.000 de balance + 10.000 aportados) / 120.000 de ingresos = 50%
    expect(getSavingsRate(totals, 10_000)).toBe(50);
  });

  it('la tasa de ahorro es null si no hubo ingresos', () => {
    expect(getSavingsRate({ income: 0, expense: 500, balance: -500, count: 1 }, 0)).toBeNull();
  });
});

describe('getMonthlySeries', () => {
  const series = getMonthlySeries(transactions, '2026-11', 3);

  it('arma un punto por mes con su balance', () => {
    expect(series.map((point) => point.monthKey)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(series.map((point) => point.balance)).toEqual([40_000, 20_000, 50_000]);
  });

  it('acumula el saldo partiendo de los movimientos anteriores a la serie', () => {
    expect(series.map((point) => point.cumulativeBalance)).toEqual([50_000, 70_000, 120_000]);
  });

  it('el saldo acumulado coincide con el saldo al cierre del mes', () => {
    expect(series.at(-1)?.cumulativeBalance).toBe(getMonthEndBalance(transactions, '2026-11'));
  });

  it('separa los aportes a Ahorro del mes', () => {
    expect(series[2].savings).toBe(10_000);
    expect(series[2].savingsRate).toBe(50);
  });
});

describe('getCategoryBreakdown', () => {
  it('agrupa por categoría, ordena de mayor a menor y calcula porcentajes', () => {
    const breakdown = getCategoryBreakdown(november, categories);
    expect(breakdown.map((item) => [item.name, item.amount])).toEqual([
      ['Supermercado', 40_000],
      ['Transporte', 20_000],
      ['Ahorro', 10_000],
    ]);
    const totalPercentage = breakdown.reduce((total, item) => total + item.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100);
  });

  it('puede excluir los aportes a Ahorro', () => {
    const breakdown = getCategoryBreakdown(november, categories, 'expense', { excludeSavings: true });
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].percentage).toBeCloseTo(66.67, 1);
  });

  it('agrupa movimientos de categorías eliminadas como "Sin categoría"', () => {
    const breakdown = getCategoryBreakdown([expense(500, '2026-11-01', { categoryId: 'borrada' })], categories);
    expect(breakdown[0].name).toBe('Sin categoría');
  });
});

describe('groupMinorCategories', () => {
  const item = (index: number, amount: number): CategoryBreakdownItem => ({
    categoryId: `cat-${index}`,
    name: `Categoría ${index}`,
    color: '#000000',
    icon: 'more',
    amount,
    percentage: amount / 10,
    count: 1,
  });

  it('junta las categorías menores en "Otras"', () => {
    const items = [300, 200, 150, 100, 100, 60, 50, 40].map((amount, index) => item(index, amount));
    const grouped = groupMinorCategories(items, 5);
    expect(grouped).toHaveLength(6);
    expect(grouped[5]).toMatchObject({ name: 'Otras (3)', amount: 150, count: 3, percentage: 15 });
  });

  it('no agrupa si sobra a lo sumo una categoría', () => {
    const items = [300, 200, 150, 100, 100, 60].map((amount, index) => item(index, amount));
    expect(groupMinorCategories(items, 5)).toEqual(items);
  });
});

describe('compareWithPreviousMonth', () => {
  it('calcula la variación porcentual contra el mes anterior', () => {
    const comparison = compareWithPreviousMonth(transactions, '2026-11');
    expect(comparison.previousMonthKey).toBe('2026-10');
    expect(comparison.changes.income).toBe(20); // 100.000 → 120.000
    expect(comparison.changes.expense).toBe(-12.5); // 80.000 → 70.000
    expect(comparison.changes.balance).toBe(150); // 20.000 → 50.000
  });
});

describe('getAverageMonthlySavingCapacity', () => {
  it('promedia (balance + aportes) de los meses completos anteriores', () => {
    // Septiembre 40.000, octubre 20.000, noviembre 50.000 + 10.000 → 120.000 / 3
    expect(getAverageMonthlySavingCapacity(transactions, '2026-12')).toBe(40_000);
  });

  it('es 0 si no hay historial', () => {
    expect(getAverageMonthlySavingCapacity([], '2026-12')).toBe(0);
  });
});

describe('getWeekdayExpenses', () => {
  it('suma los gastos por día de la semana sin contar ingresos ni aportes a Ahorro', () => {
    const points = getWeekdayExpenses([
      expense(1000, '2026-11-16'), // lunes
      expense(500, '2026-11-23'), // lunes
      expense(800, '2026-11-22'), // domingo
      income(9999, '2026-11-16'),
      expense(9999, '2026-11-16', { categoryId: SYSTEM_CATEGORY.savings }),
    ]);
    expect(points[0]).toEqual({ day: 'Lun', amount: 1500, count: 2 });
    expect(points[6]).toEqual({ day: 'Dom', amount: 800, count: 1 });
  });
});
