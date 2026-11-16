import { describe, expect, it } from 'vitest';
import { expense, income, makeBudget, makeData, makeGoal } from '@/test/factories';
import { generateAssistantReport, type AssistantReport, type InsightSeverity } from './index';

const SEVERITY_RANK: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };

function expectSortedBySeverity(report: AssistantReport) {
  const ranks = report.insights.map((insight) => SEVERITY_RANK[insight.severity]);
  expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
}

describe('generateAssistantReport', () => {
  it('sin movimientos invita a registrar datos y solo evalúa los objetivos', () => {
    const report = generateAssistantReport(makeData(), '2026-11', '2026-11-16');
    expect(report.hasData).toBe(false);
    expect(report.insights.map((insight) => insight.id)).toEqual(['no-data', 'goals-0']);
  });

  it('sin movimientos igual alerta sobre un objetivo vencido', () => {
    const data = makeData({ goals: [makeGoal({ name: 'Notebook', savedAmount: 10_000, deadline: '2026-10-01' })] });
    const report = generateAssistantReport(data, '2026-11', '2026-11-16');
    expect(report.insights[0]).toMatchObject({ severity: 'critical', title: 'El objetivo "Notebook" venció' });
  });

  it('puntúa un mes ordenado como "Excelente"', () => {
    // Octubre (mes cerrado): ahorra el 50%, gasta menos que en septiembre y respeta el presupuesto.
    const data = makeData({
      transactions: [
        income(100_000, '2026-09-01'),
        expense(60_000, '2026-09-10'),
        income(100_000, '2026-10-01'),
        expense(50_000, '2026-10-10'),
      ],
      budgets: [makeBudget('exp-supermercado', '2026-10', 70_000)],
    });
    const report = generateAssistantReport(data, '2026-10', '2026-11-16');

    expect(report.score.components.map((component) => [component.key, component.score])).toEqual([
      ['savings', 35],
      ['budgets', 25],
      ['trend', 20],
      ['goals', 10], // sin objetivos: puntaje neutro (la mitad)
    ]);
    expect(report.score).toMatchObject({ total: 90, label: 'Excelente' });
    expect(report.metrics.savingsRate).toBe(50);
    expect(report.metrics.consumptionChange).toBeCloseTo(-16.67, 1);
    expect(report.insights.some((insight) => insight.severity === 'critical')).toBe(false);
    expectSortedBySeverity(report);
  });

  it('prioriza las alertas críticas cuando se gasta de más', () => {
    const data = makeData({
      transactions: [
        income(100_000, '2026-10-01'),
        expense(80_000, '2026-10-05', { categoryId: 'exp-supermercado' }),
        expense(50_000, '2026-10-15', { categoryId: 'exp-ocio' }),
      ],
      budgets: [makeBudget('exp-supermercado', '2026-10', 50_000)],
    });
    const report = generateAssistantReport(data, '2026-10', '2026-11-16');
    const ids = report.insights.map((insight) => insight.id);

    expect(report.insights[0].severity).toBe('critical');
    expect(ids).toContain('monthly-balance-0'); // gastó más de lo que ingresó
    expect(ids).toContain('budgets-0'); // superó el presupuesto de Supermercado
    expectSortedBySeverity(report);
  });

  it('en el mes en curso evalúa la proyección de cierre y no el saldo parcial', () => {
    // Al día 10 cobró 100.000 y gastó 50.000: el saldo parcial es positivo (50% de ahorro),
    // pero a ese ritmo el mes cerraría con gastos de 150.000.
    const data = makeData({
      transactions: [
        income(100_000, '2026-10-01'),
        expense(100_000, '2026-10-15'),
        income(100_000, '2026-11-01'),
        expense(50_000, '2026-11-08'),
      ],
    });
    const report = generateAssistantReport(data, '2026-11', '2026-11-10');

    expect(report.projection).toEqual({ expense: 150_000, balance: -50_000 });
    expect(report.score.label).toBe('En riesgo');
    expect(report.insights.find((insight) => insight.id.startsWith('month-projection'))).toMatchObject({ severity: 'warning' });
  });
});
