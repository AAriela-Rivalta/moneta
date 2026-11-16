import { describe, expect, it } from 'vitest';
import { makeGoal } from '@/test/factories';
import {
  assessFeasibility,
  buildSavingsProjection,
  describeTimeLeft,
  getGoalProgress,
  getGoalsSummary,
  simulateCompletion,
  simulateMonthlyPlan,
} from './goals';

const TODAY = '2026-11-16';

describe('getGoalProgress', () => {
  it('calcula el progreso y la cuota necesaria de un objetivo activo', () => {
    // Del 16/11/2026 al 16/05/2027 hay 181 días ≈ 6 meses.
    const progress = getGoalProgress(makeGoal({ targetAmount: 100_000, savedAmount: 40_000, deadline: '2027-05-16' }), TODAY);
    expect(progress).toEqual({
      percentage: 40,
      remaining: 60_000,
      daysLeft: 181,
      monthsLeft: 6,
      monthlyNeeded: 10_000,
      weeklyNeeded: 2_308, // 60.000 / 26 semanas, redondeado hacia arriba
      status: 'active',
    });
  });

  it('marca como cumplido el objetivo alcanzado y limita el progreso al 100%', () => {
    const progress = getGoalProgress(makeGoal({ targetAmount: 100_000, savedAmount: 120_000 }), TODAY);
    expect(progress.status).toBe('completed');
    expect(progress.percentage).toBe(100);
    expect(progress.monthlyNeeded).toBe(0);
  });

  it('marca como vencido el objetivo no alcanzado con fecha pasada', () => {
    const progress = getGoalProgress(makeGoal({ savedAmount: 10_000, deadline: '2026-10-01' }), TODAY);
    expect(progress.status).toBe('overdue');
    expect(progress.monthlyNeeded).toBe(0);
  });
});

describe('getGoalsSummary', () => {
  it('suma lo ahorrado sin contar el excedente de los objetivos cumplidos', () => {
    const summary = getGoalsSummary(
      [makeGoal({ targetAmount: 100_000, savedAmount: 150_000 }), makeGoal({ targetAmount: 100_000, savedAmount: 50_000 })],
      TODAY,
    );
    expect(summary).toEqual({ totalTarget: 200_000, totalSaved: 150_000, percentage: 75, completed: 1, active: 1 });
  });
});

describe('simulador de ahorro', () => {
  it('calcula cuánto ahorrar por mes, semana y día hasta la fecha límite', () => {
    const plan = simulateMonthlyPlan(100_000, 40_000, '2027-05-16', TODAY);
    expect(plan).toMatchObject({ remaining: 60_000, monthsLeft: 6, monthly: 10_000, daily: 332, isPastDeadline: false });
  });

  it('estima cuándo se llega a la meta con un aporte fijo', () => {
    expect(simulateCompletion(100_000, 40_000, 15_000, TODAY)).toEqual({ monthsNeeded: 4, estimatedDate: '2027-03-16' });
  });

  it('no puede estimar sin aporte y devuelve hoy si ya se cumplió', () => {
    expect(simulateCompletion(100_000, 40_000, 0, TODAY)).toBeNull();
    expect(simulateCompletion(100_000, 100_000, 0, TODAY)).toEqual({ monthsNeeded: 0, estimatedDate: TODAY });
  });

  it('proyecta el ahorro acumulado mes a mes sin superar la meta', () => {
    const projection = buildSavingsProjection(100_000, 40_000, 25_000, 4, TODAY);
    expect(projection.map((point) => point.saved)).toEqual([40_000, 65_000, 90_000, 100_000, 100_000]);
    expect(projection[0].label).toBe('Nov 26');
  });
});

describe('assessFeasibility', () => {
  it('compara la cuota necesaria con la capacidad de ahorro real', () => {
    expect(assessFeasibility(10_000, 40_000)).toEqual({ level: 'comfortable', ratio: 25 });
    expect(assessFeasibility(30_000, 40_000)).toEqual({ level: 'tight', ratio: 75 });
    expect(assessFeasibility(50_000, 40_000)).toEqual({ level: 'unrealistic', ratio: 125 });
    expect(assessFeasibility(10_000, 0)).toEqual({ level: 'unknown', ratio: null });
  });
});

describe('describeTimeLeft', () => {
  it('describe el tiempo restante en lenguaje natural', () => {
    expect(describeTimeLeft(-1)).toBe('Venció hace 1 día');
    expect(describeTimeLeft(0)).toBe('Vence hoy');
    expect(describeTimeLeft(10)).toBe('Faltan 10 días');
    expect(describeTimeLeft(181)).toBe('Faltan 6 meses');
  });
});
