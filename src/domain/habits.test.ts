import { describe, expect, it } from 'vitest';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { categoryMap, expense, income } from '@/test/factories';
import {
  buildHabitsReport,
  getCategoryStability,
  getMonthRhythm,
  getRepeatPurchases,
  getStabilityLevel,
} from './habits';

const categories = categoryMap();
const MONTH = '2026-11';

describe('getMonthRhythm', () => {
  it('separa los días 10, 11, 20 y 21 en inicio, medio y cierre', () => {
    const rhythm = getMonthRhythm(
      [
        expense(1_000, '2026-11-10', { categoryId: 'exp-supermercado' }),
        expense(400, '2026-11-11', { categoryId: 'exp-ocio' }),
        expense(600, '2026-11-20', { categoryId: 'exp-ocio' }),
        expense(2_000, '2026-11-21', { categoryId: 'exp-transporte' }),
        income(90_000, '2026-11-01'),
        expense(50_000, '2026-11-03', { categoryId: SYSTEM_CATEGORY.savings }),
        expense(80_000, '2026-10-21', { categoryId: 'exp-transporte' }),
      ],
      MONTH,
    );

    expect(rhythm.total).toBe(4_000);
    expect(rhythm.count).toBe(4);
    expect(rhythm.buckets.map((bucket) => [bucket.id, bucket.amount, bucket.count, bucket.percentage])).toEqual([
      ['start', 1_000, 1, 25],
      ['middle', 1_000, 2, 25],
      ['end', 2_000, 1, 50],
    ]);
    expect(rhythm.dominant).toBe('end');
  });

  it('en un empate se queda con el tramo más temprano', () => {
    const rhythm = getMonthRhythm(
      [
        expense(300, '2026-11-02'),
        expense(300, '2026-11-15'),
        expense(100, '2026-11-25'),
      ],
      MONTH,
    );

    expect(rhythm.dominant).toBe('start');
  });

  it('un mes sin gastos de consumo no tiene tramo dominante', () => {
    const rhythm = getMonthRhythm(
      [income(20_000, '2026-11-01'), expense(5_000, '2026-11-04', { categoryId: SYSTEM_CATEGORY.savings })],
      MONTH,
    );

    expect(rhythm.total).toBe(0);
    expect(rhythm.count).toBe(0);
    expect(rhythm.dominant).toBeNull();
    expect(rhythm.buckets.every((bucket) => bucket.amount === 0 && bucket.count === 0 && bucket.percentage === 0)).toBe(true);
  });
});

describe('getRepeatPurchases', () => {
  it('agrupa variantes de la misma descripción y separa categorías', () => {
    const purchases = getRepeatPurchases(
      [
        expense(1_000, '2026-10-01', { description: 'Café Martínez 12', categoryId: 'exp-supermercado' }),
        expense(1_500, '2026-10-15', { description: 'Cafe Martinez', categoryId: 'exp-supermercado' }),
        expense(2_000, '2026-11-02', { description: 'CAFÉ MARTINEZ 3', categoryId: 'exp-supermercado' }),
        expense(500, '2026-11-20', { description: 'café martinez', categoryId: 'exp-supermercado' }),
        income(40_000, '2026-11-01', { description: 'café martinez' }),
        expense(9_000, '2026-11-08', { description: 'café martinez', categoryId: SYSTEM_CATEGORY.savings }),
        expense(70_000, '2026-08-02', { description: 'café martinez', categoryId: 'exp-supermercado' }),
        ...['01', '02', '03', '04'].map((day) => expense(100, `2026-11-${day}`, { description: 'Kiosco', categoryId: 'exp-ocio' })),
        ...['01', '02', '03', '04'].map((day) => expense(200, `2026-10-${day}`, { description: 'Kiosco', categoryId: 'exp-transporte' })),
        ...['123', '12.3', '1-2-3', '123'].map((description, index) =>
          expense(50, `2026-11-1${index}`, { description, categoryId: 'exp-ropa' }),
        ),
        expense(3_000, '2026-09-08', { description: 'Netflix', categoryId: 'exp-suscripciones' }),
        expense(3_000, '2026-10-08', { description: 'Netflix', categoryId: 'exp-suscripciones' }),
        expense(3_000, '2026-11-08', { description: 'Netflix', categoryId: 'exp-suscripciones' }),
      ],
      categories,
      MONTH,
    );

    expect(purchases.map((item) => [item.description, item.categoryId, item.count, item.monthsActive, item.perMonth, item.total, item.averageTicket])).toEqual([
      ['café martinez', 'exp-supermercado', 4, 2, 2, 5_000, 1_250],
      ['Kiosco', 'exp-transporte', 4, 1, 4, 800, 200],
      ['Kiosco', 'exp-ocio', 4, 1, 4, 400, 100],
    ]);
    expect(purchases[0]).toMatchObject({ categoryName: 'Supermercado', color: '#eb6834', icon: 'cart', key: 'cafe martinez|exp-supermercado' });
    expect(purchases.some((item) => item.description === 'Netflix' || item.categoryId === 'exp-ropa')).toBe(false);
  });

  it('exige al menos cuatro movimientos aunque haya varios en el mismo mes', () => {
    const purchases = getRepeatPurchases(
      ['01', '02', '03'].map((day) => expense(100, `2026-11-${day}`, { description: 'Delivery', categoryId: 'exp-restaurantes' })),
      categories,
      MONTH,
    );

    expect(purchases).toEqual([]);
  });

  it('exige más de 1,5 movimientos por mes con actividad', () => {
    const onceAMonth = ['2026-09-04', '2026-10-04', '2026-11-04', '2026-11-18'].map((date) =>
      expense(100, date, { description: 'Gimnasio', categoryId: 'exp-salud' }),
    );
    const frequent = ['2026-09-04', '2026-09-18', '2026-10-04', '2026-11-04', '2026-11-18'].map((date) =>
      expense(100, date, { description: 'Gimnasio', categoryId: 'exp-salud' }),
    );

    expect(getRepeatPurchases(onceAMonth, categories, MONTH)).toEqual([]);
    expect(getRepeatPurchases(frequent, categories, MONTH)).toMatchObject([{ count: 5, monthsActive: 3, perMonth: 5 / 3, total: 500 }]);
  });

  it('ordena por cantidad y luego por importe, y devuelve cinco grupos como máximo', () => {
    const names = [
      ['alfa', 100],
      ['beta', 200],
      ['gamma', 300],
      ['delta', 400],
      ['épsilon', 500],
      ['zeta', 600],
    ] as const;
    const transactions = names.flatMap(([description, amount]) =>
      ['2026-10-02', '2026-10-03', '2026-11-02', '2026-11-03'].map((date) => expense(amount, date, { description, categoryId: 'exp-ocio' })),
    );

    const purchases = getRepeatPurchases(transactions, categories, MONTH);

    expect(purchases).toHaveLength(5);
    expect(purchases.map((item) => item.description)).toEqual(['zeta', 'épsilon', 'delta', 'gamma', 'beta']);
    expect(purchases.map((item) => item.total)).toEqual([2_400, 2_000, 1_600, 1_200, 800]);
  });
});

describe('getStabilityLevel', () => {
  it('deja 0,25 en estable y 0,60 en variable', () => {
    expect(getStabilityLevel(0)).toBe('stable');
    expect(getStabilityLevel(0.25)).toBe('stable');
    expect(getStabilityLevel(0.250001)).toBe('variable');
    expect(getStabilityLevel(0.6)).toBe('variable');
    expect(getStabilityLevel(0.600001)).toBe('irregular');
  });
});

describe('getCategoryStability', () => {
  const transactions = [
    ...['2026-09-10', '2026-10-10', '2026-11-10'].map((date) => expense(100, date, { categoryId: 'exp-supermercado' })),
    expense(100, '2026-09-10', { categoryId: 'exp-transporte' }),
    expense(200, '2026-10-10', { categoryId: 'exp-transporte' }),
    expense(300, '2026-11-10', { categoryId: 'exp-transporte' }),
    expense(100, '2026-09-10', { categoryId: 'exp-ocio' }),
    expense(100, '2026-10-10', { categoryId: 'exp-ocio' }),
    expense(500, '2026-11-10', { categoryId: 'exp-salud' }),
    expense(9_000, '2026-08-10', { categoryId: 'exp-supermercado' }),
    ...['2026-09-10', '2026-10-10', '2026-11-10'].map((date) => expense(1_000, date, { categoryId: SYSTEM_CATEGORY.savings })),
    income(80_000, '2026-11-01'),
  ];
  const stability = getCategoryStability(transactions, categories, MONTH);
  const byCategory = (categoryId: string) => stability.find((item) => item.categoryId === categoryId);

  it('clasifica series parejas, crecientes e interrumpidas, y conserva el cero del mes vacío', () => {
    expect(byCategory('exp-supermercado')).toMatchObject({
      name: 'Supermercado',
      mean: 100,
      variation: 0,
      level: 'stable',
      monthly: [
        { monthKey: '2026-09', amount: 100 },
        { monthKey: '2026-10', amount: 100 },
        { monthKey: '2026-11', amount: 100 },
      ],
    });
    expect(byCategory('exp-transporte')).toMatchObject({ mean: 200, level: 'variable' });
    expect(byCategory('exp-transporte')?.variation).toBeCloseTo(Math.sqrt(1 / 6), 10);
    expect(byCategory('exp-ocio')).toMatchObject({
      mean: 200 / 3,
      level: 'irregular',
      monthly: [
        { monthKey: '2026-09', amount: 100 },
        { monthKey: '2026-10', amount: 100 },
        { monthKey: '2026-11', amount: 0 },
      ],
    });
    expect(byCategory('exp-ocio')?.variation).toBeCloseTo(Math.SQRT1_2, 10);
  });

  it('deja afuera un solo mes con gasto, el ahorro, los ingresos y lo que está antes de la ventana', () => {
    expect(byCategory('exp-salud')).toBeUndefined();
    expect(byCategory(SYSTEM_CATEGORY.savings)).toBeUndefined();
    expect(stability.map((item) => item.categoryId)).toEqual(['exp-supermercado', 'exp-transporte', 'exp-ocio']);
  });

  it('devuelve como máximo ocho categorías, de la más estable a la menos estable', () => {
    const ids = [
      'exp-transporte',
      'exp-educacion',
      'exp-ocio',
      'exp-otros',
      'exp-restaurantes',
      'exp-ropa',
      'exp-salud',
      'exp-servicios',
      'exp-supermercado',
    ];
    const many = ids.flatMap((categoryId) =>
      ['2026-09-10', '2026-10-10', '2026-11-10'].map((date) => expense(100, date, { categoryId, description: categoryId })),
    );

    const result = getCategoryStability(many, categories, MONTH);

    expect(result).toHaveLength(8);
    expect(result.every((item) => item.level === 'stable' && item.variation === 0)).toBe(true);
    expect(result.map((item) => item.name)).toEqual([
      'Educación',
      'Ocio y salidas',
      'Otros gastos',
      'Restaurantes',
      'Ropa y cuidado personal',
      'Salud y bienestar',
      'Servicios',
      'Supermercado',
    ]);
    expect(result.some((item) => item.categoryId === 'exp-transporte')).toBe(false);
  });
});

describe('buildHabitsReport', () => {
  it('reúne la ventana, el ritmo del mes elegido y deja los movimientos intactos', () => {
    const transactions = Object.freeze([
      Object.freeze(expense(9_999, '2026-08-15', { description: 'Viejo', categoryId: 'exp-ocio' })),
      Object.freeze(expense(1_000, '2026-09-05', { description: 'Farmacia', categoryId: 'exp-salud' })),
      Object.freeze(expense(1_000, '2026-10-05', { description: 'Farmacia', categoryId: 'exp-salud' })),
      Object.freeze(expense(1_000, '2026-11-05', { description: 'Farmacia', categoryId: 'exp-salud' })),
    ]);

    const report = buildHabitsReport(transactions, categories, MONTH);

    expect(report.monthKey).toBe(MONTH);
    expect(report.window).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(report.rhythm).toMatchObject({ total: 1_000, dominant: 'start' });
    expect(report.rhythm.buckets[0]).toMatchObject({ id: 'start', amount: 1_000, count: 1 });
    expect(report.repeats).toEqual([]);
    expect(report.stability).toMatchObject([{ categoryId: 'exp-salud', mean: 1_000, variation: 0, level: 'stable' }]);
    expect(transactions[0].amount).toBe(9_999);
    expect(transactions).toHaveLength(4);
  });
});
