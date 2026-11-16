import { describe, expect, it } from 'vitest';
import { cloneDefaultCategories } from '@/data/defaultCategories';
import { categoryMap, makeBudget, makeGoal } from '@/test/factories';
import {
  hasErrors,
  parseAmount,
  validateAmountField,
  validateBudget,
  validateCategory,
  validateContribution,
  validateGoal,
  validateTransaction,
  type TransactionFormValues,
} from './validation';

const TODAY = '2026-11-16';
const categories = categoryMap();

describe('parseAmount', () => {
  it.each([
    ['15000', 15000],
    ['15.000', 15000],
    ['15.000,50', 15000.5],
    ['1.234.567', 1234567],
    ['15000.5', 15000.5],
    ['15,5', 15.5],
    ['1,234.56', 1234.56],
    ['1.5', 1.5],
    ['$ 2.500', 2500],
    ['  800  ', 800],
    ['-300', -300],
  ])('interpreta "%s" como %d', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '12a', '.', '1.2.3,4,5'])('devuelve NaN para "%s"', (raw) => {
    expect(parseAmount(raw)).toBeNaN();
  });
});

describe('validateAmountField', () => {
  it('exige un monto positivo y razonable', () => {
    expect(validateAmountField('')).toBe('Ingresá un monto.');
    expect(validateAmountField('hola')).toMatch(/número válido/);
    expect(validateAmountField('-5')).toBe('El monto no puede ser negativo.');
    expect(validateAmountField('0')).toBe('El monto debe ser mayor a cero.');
    expect(validateAmountField('1000000000000')).toBe('El monto es demasiado grande.');
    expect(validateAmountField('15.000,50')).toBeUndefined();
  });

  it('permite cero cuando se indica', () => {
    expect(validateAmountField('0', { allowZero: true })).toBeUndefined();
  });
});

describe('validateTransaction', () => {
  const valid: TransactionFormValues = {
    type: 'expense',
    description: 'Compra semanal',
    amount: '15.000,50',
    categoryId: 'exp-supermercado',
    date: '2026-11-10',
    notes: '',
  };

  it('acepta un movimiento completo', () => {
    expect(hasErrors(validateTransaction(valid, categories, TODAY))).toBe(false);
  });

  it('valida la descripción', () => {
    expect(validateTransaction({ ...valid, description: '   ' }, categories, TODAY).description).toBe('Ingresá una descripción.');
    expect(validateTransaction({ ...valid, description: 'a' }, categories, TODAY).description).toBe('La descripción es demasiado corta.');
    expect(validateTransaction({ ...valid, description: 'x'.repeat(81) }, categories, TODAY).description).toMatch(/80 caracteres/);
  });

  it('rechaza una categoría que no corresponde al tipo', () => {
    const errors = validateTransaction({ ...valid, type: 'income' }, categories, TODAY);
    expect(errors.categoryId).toBe('La categoría no corresponde al tipo de movimiento.');
  });

  it('rechaza fechas inválidas, muy antiguas o a más de un año', () => {
    expect(validateTransaction({ ...valid, date: '2026-02-30' }, categories, TODAY).date).toBe('La fecha no es válida.');
    expect(validateTransaction({ ...valid, date: '1999-12-31' }, categories, TODAY).date).toBe('La fecha es demasiado antigua.');
    expect(validateTransaction({ ...valid, date: '2027-12-01' }, categories, TODAY).date).toMatch(/un año a futuro/);
  });
});

describe('validateBudget', () => {
  const budgets = [makeBudget('exp-ocio', '2026-11', 1000, 'bud-ocio')];
  const context = { budgets, categories, monthKey: '2026-11' };

  it('no permite dos presupuestos para la misma categoría y mes', () => {
    const errors = validateBudget({ categoryId: 'exp-ocio', limit: '2000' }, context);
    expect(errors.categoryId).toBe('Ya existe un presupuesto para esta categoría en el mes.');
  });

  it('permite editar el presupuesto existente', () => {
    const errors = validateBudget({ categoryId: 'exp-ocio', limit: '2000' }, { ...context, editingId: 'bud-ocio' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('permite la misma categoría en otro mes', () => {
    const errors = validateBudget({ categoryId: 'exp-ocio', limit: '2000' }, { ...context, monthKey: '2026-12' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('solo acepta categorías de gasto', () => {
    const errors = validateBudget({ categoryId: 'inc-sueldo', limit: '2000' }, context);
    expect(errors.categoryId).toBe('Solo se pueden presupuestar categorías de gasto.');
  });
});

describe('validateGoal', () => {
  const valid = { name: 'Viaje', targetAmount: '500.000', savedAmount: '', deadline: '2027-06-01' };

  it('acepta un objetivo válido (el monto ahorrado puede quedar vacío)', () => {
    expect(hasErrors(validateGoal(valid, TODAY, false))).toBe(false);
  });

  it('exige una fecha límite futura al crear, pero no al editar', () => {
    expect(validateGoal({ ...valid, deadline: TODAY }, TODAY, false).deadline).toBe('La fecha límite debe ser posterior a hoy.');
    expect(validateGoal({ ...valid, deadline: TODAY }, TODAY, true).deadline).toBeUndefined();
  });
});

describe('validateContribution', () => {
  const goal = makeGoal({ savedAmount: 5000 });

  it('no permite retirar más de lo ahorrado', () => {
    expect(validateContribution({ amount: '6000' }, 'withdraw', goal).amount).toMatch(/No podés retirar más/);
    expect(validateContribution({ amount: '5000' }, 'withdraw', goal)).toEqual({});
  });

  it('permite aportar cualquier monto válido', () => {
    expect(validateContribution({ amount: '6000' }, 'deposit', goal)).toEqual({});
  });
});

describe('validateCategory', () => {
  const list = cloneDefaultCategories();

  it('detecta nombres repetidos sin importar mayúsculas ni tildes', () => {
    expect(validateCategory({ name: 'EDUCACION', type: 'expense' }, list).name).toBe('Ya existe una categoría con ese nombre.');
  });

  it('permite el mismo nombre en el otro tipo de movimiento', () => {
    expect(hasErrors(validateCategory({ name: 'Educación', type: 'income' }, list))).toBe(false);
  });

  it('permite conservar el nombre al editar la propia categoría', () => {
    expect(hasErrors(validateCategory({ name: 'Educación', type: 'expense' }, list, 'exp-educacion'))).toBe(false);
  });
});
