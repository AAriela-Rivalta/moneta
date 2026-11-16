import { describe, expect, it } from 'vitest';
import { categoryMap, expense, income, makeBudget } from '@/test/factories';
import {
  getBudgetAlerts,
  getBudgetLevel,
  getBudgetLevelLabel,
  getBudgetStatuses,
  getBudgetSummary,
  planBudgetCopy,
  suggestBudgetLimit,
} from './budgets';

const categories = categoryMap();
const TODAY = '2026-11-16';

describe('getBudgetLevel', () => {
  it('alerta desde el 80% y marca excedido por encima del 100%', () => {
    expect(getBudgetLevel(79.99)).toBe('ok');
    expect(getBudgetLevel(80)).toBe('warning');
    expect(getBudgetLevel(100)).toBe('warning');
    expect(getBudgetLevel(100.01)).toBe('exceeded');
  });

  it('distingue "Agotado" (100% justo) de "Cerca del límite"', () => {
    expect(getBudgetLevelLabel({ level: 'warning', percentage: 100 })).toBe('Agotado');
    expect(getBudgetLevelLabel({ level: 'warning', percentage: 85 })).toBe('Cerca del límite');
    expect(getBudgetLevelLabel({ level: 'exceeded', percentage: 120 })).toBe('Excedido');
  });
});

describe('getBudgetStatuses', () => {
  const budgets = [
    makeBudget('exp-supermercado', '2026-11', 50_000),
    makeBudget('exp-ocio', '2026-11', 10_000),
    makeBudget('exp-transporte', '2026-11', 40_000),
    makeBudget('exp-supermercado', '2026-10', 1), // otro mes: se ignora
  ];
  const transactions = [
    expense(45_000, '2026-11-05', { categoryId: 'exp-supermercado' }),
    expense(12_000, '2026-11-07', { categoryId: 'exp-ocio' }),
    expense(10_000, '2026-11-09', { categoryId: 'exp-transporte' }),
    expense(99_999, '2026-10-30', { categoryId: 'exp-supermercado' }), // otro mes: no cuenta
    income(500_000, '2026-11-01'),
  ];
  const statuses = getBudgetStatuses(budgets, transactions, categories, '2026-11', TODAY);

  it('calcula gastado, disponible, porcentaje y nivel de cada presupuesto del mes', () => {
    expect(statuses.map((status) => [status.category?.name, status.spent, status.remaining, status.percentage, status.level])).toEqual([
      ['Ocio y salidas', 12_000, -2_000, 120, 'exceeded'],
      ['Supermercado', 45_000, 5_000, 90, 'warning'],
      ['Transporte', 10_000, 30_000, 25, 'ok'],
    ]);
  });

  it('en el mes en curso calcula cuánto se puede gastar por día', () => {
    const supermarket = statuses.find((status) => status.budget.categoryId === 'exp-supermercado')!;
    // Del 16 al 30 de noviembre quedan 15 días: 5.000 / 15 = 333,33 → 333
    expect(supermarket.daysLeft).toBe(15);
    expect(supermarket.dailyAllowance).toBe(333);
  });

  it('no sugiere monto diario si el presupuesto ya se superó', () => {
    const leisure = statuses.find((status) => status.budget.categoryId === 'exp-ocio')!;
    expect(leisure.dailyAllowance).toBeNull();
  });

  it('en meses pasados no calcula días restantes', () => {
    const past = getBudgetStatuses(budgets, transactions, categories, '2026-10', TODAY);
    expect(past[0].daysLeft).toBeNull();
    expect(past[0].dailyAllowance).toBeNull();
  });

  it('resume el mes y devuelve solo los presupuestos en alerta', () => {
    expect(getBudgetSummary(statuses)).toMatchObject({ totalLimit: 100_000, totalSpent: 67_000, remaining: 33_000, warningCount: 1, exceededCount: 1 });
    expect(getBudgetAlerts(statuses).map((status) => status.level)).toEqual(['exceeded', 'warning']);
  });
});

describe('planBudgetCopy', () => {
  it('copia los presupuestos al mes siguiente sin duplicar categorías', () => {
    const budgets = [
      makeBudget('exp-supermercado', '2026-10', 50_000),
      makeBudget('exp-ocio', '2026-10', 10_000),
      makeBudget('exp-supermercado', '2026-11', 60_000),
    ];
    const copies = planBudgetCopy(budgets, '2026-10', '2026-11');
    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatchObject({ categoryId: 'exp-ocio', month: '2026-11', limit: 10_000 });
    expect(copies[0].id).not.toBe(budgets[1].id);
  });
});

describe('suggestBudgetLimit', () => {
  it('promedia los 3 meses anteriores con gasto y redondea hacia arriba', () => {
    const transactions = [
      expense(41_000, '2026-09-10', { categoryId: 'exp-supermercado' }),
      expense(43_500, '2026-10-10', { categoryId: 'exp-supermercado' }),
      expense(90_000, '2026-11-02', { categoryId: 'exp-supermercado' }), // mes actual: no cuenta
    ];
    // Agosto sin gasto se ignora: (41.000 + 43.500) / 2 = 42.250 → 43.000
    expect(suggestBudgetLimit(transactions, 'exp-supermercado', '2026-11')).toBe(43_000);
  });

  it('devuelve null si no hay historial', () => {
    expect(suggestBudgetLimit([], 'exp-supermercado', '2026-11')).toBeNull();
  });
});
