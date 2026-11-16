import { describe, expect, it } from 'vitest';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { expense, income, makeBudget, makeData, makeGoal } from '@/test/factories';
import { appDataReducer } from './appDataReducer';

/** Objetivo con $40.000 ahorrados, de los cuales $10.000 vienen de un aporte registrado como movimiento. */
function goalScenario() {
  const goal = makeGoal({ id: 'goal-viaje', savedAmount: 40_000 });
  const contribution = expense(10_000, '2026-11-05', { categoryId: SYSTEM_CATEGORY.savings, goalId: goal.id, description: 'Aporte' });
  return { goal, contribution, state: makeData({ goals: [goal], transactions: [contribution] }) };
}

describe('movimientos vinculados a objetivos', () => {
  it('al eliminar un aporte se descuenta del objetivo', () => {
    const { contribution, state } = goalScenario();
    const next = appDataReducer(state, { type: 'transaction/delete', id: contribution.id });
    expect(next.transactions).toHaveLength(0);
    expect(next.goals[0].savedAmount).toBe(30_000);
  });

  it('al editar el monto de un aporte se ajusta el objetivo', () => {
    const { contribution, state } = goalScenario();
    const { description, type, categoryId, date } = contribution;
    const next = appDataReducer(state, {
      type: 'transaction/update',
      id: contribution.id,
      changes: { description, type, categoryId, date, amount: 15_000 },
    });
    expect(next.goals[0].savedAmount).toBe(45_000);
  });

  it('al eliminar un retiro se devuelve el dinero al objetivo', () => {
    const { goal, state } = goalScenario();
    const withdrawal = income(5_000, '2026-11-12', { categoryId: 'inc-otros', goalId: goal.id });
    const withWithdrawal = appDataReducer(state, { type: 'goal/contribute', goalId: goal.id, delta: -5_000, transaction: withdrawal });
    expect(withWithdrawal.goals[0].savedAmount).toBe(35_000);

    const next = appDataReducer(withWithdrawal, { type: 'transaction/delete', id: withdrawal.id });
    expect(next.goals[0].savedAmount).toBe(40_000);
  });

  it('el monto ahorrado nunca queda negativo', () => {
    const goal = makeGoal({ id: 'goal-chico', savedAmount: 3_000 });
    const contribution = expense(10_000, '2026-11-05', { categoryId: SYSTEM_CATEGORY.savings, goalId: goal.id });
    const state = makeData({ goals: [goal], transactions: [contribution] });
    expect(appDataReducer(state, { type: 'transaction/delete', id: contribution.id }).goals[0].savedAmount).toBe(0);
  });

  it('al eliminar un objetivo se conservan sus movimientos, pero desvinculados', () => {
    const { goal, state } = goalScenario();
    const next = appDataReducer(state, { type: 'goal/delete', id: goal.id });
    expect(next.goals).toHaveLength(0);
    expect(next.transactions).toHaveLength(1);
    expect(next.transactions[0].goalId).toBeUndefined();
  });

  it('restaurar un movimiento eliminado (deshacer) no lo duplica', () => {
    const { contribution, state } = goalScenario();
    expect(appDataReducer(state, { type: 'transaction/restore', transaction: contribution })).toBe(state);
  });
});

describe('categorías', () => {
  it('al eliminar una categoría, sus movimientos pasan a "Otros" y se borran sus presupuestos', () => {
    const state = makeData({
      transactions: [expense(1000, '2026-11-10', { categoryId: 'exp-ocio' }), expense(2000, '2026-11-11', { categoryId: 'exp-salud' })],
      budgets: [makeBudget('exp-ocio', '2026-11', 5000), makeBudget('exp-salud', '2026-11', 5000)],
    });
    const next = appDataReducer(state, { type: 'category/delete', id: 'exp-ocio' });

    expect(next.categories.some((category) => category.id === 'exp-ocio')).toBe(false);
    expect(next.transactions.map((tx) => tx.categoryId)).toEqual([SYSTEM_CATEGORY.otherExpense, 'exp-salud']);
    expect(next.budgets.map((budget) => budget.categoryId)).toEqual(['exp-salud']);
  });

  it('no permite eliminar categorías del sistema', () => {
    const state = makeData();
    expect(appDataReducer(state, { type: 'category/delete', id: SYSTEM_CATEGORY.savings })).toBe(state);
  });
});

describe('presupuestos', () => {
  it('al copiar presupuestos omite los que ya existen para esa categoría y mes', () => {
    const state = makeData({ budgets: [makeBudget('exp-ocio', '2026-11', 5000)] });
    const next = appDataReducer(state, {
      type: 'budget/add-many',
      budgets: [makeBudget('exp-ocio', '2026-11', 9999), makeBudget('exp-salud', '2026-11', 3000)],
    });
    expect(next.budgets.map((budget) => [budget.categoryId, budget.limit])).toEqual([
      ['exp-ocio', 5000],
      ['exp-salud', 3000],
    ]);
  });
});
