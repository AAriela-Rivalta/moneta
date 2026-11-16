import { describe, expect, it } from 'vitest';
import { expense, income, makeBudget, makeData, makeGoal } from '@/test/factories';
import { parseAppData, sanitizeAppData, serializeAppData } from './storage';

const category = (id: string, name: string, type: 'income' | 'expense') => ({ id, name, type, color: '#2a78d6', icon: 'home' });

describe('sanitizeAppData', () => {
  it('rechaza estructuras que no son datos de la app', () => {
    expect(sanitizeAppData(null)).toBeNull();
    expect(sanitizeAppData('texto')).toBeNull();
    expect(sanitizeAppData({ transactions: [] })).toBeNull();
  });

  it('descarta movimientos corruptos y conserva los válidos', () => {
    const valid = expense(1000, '2026-11-10', { categoryId: 'exp-ocio' });
    const data = sanitizeAppData({
      categories: [category('exp-ocio', 'Ocio', 'expense')],
      transactions: [
        valid,
        { ...valid, id: 'negativo', amount: -50 },
        { ...valid, id: 'fecha-invalida', date: '2026-02-30' },
        { ...valid, id: 'sin-descripcion', description: '  ' },
        { ...valid, id: 'tipo-raro', type: 'transfer' },
        'basura',
      ],
      budgets: [],
      goals: [],
    });
    expect(data?.transactions).toEqual([valid]);
  });

  it('reasigna a "Otros" los movimientos con categoría inexistente o de otro tipo', () => {
    const data = sanitizeAppData({
      categories: [category('exp-ocio', 'Ocio', 'expense')],
      transactions: [expense(1000, '2026-11-10', { categoryId: 'no-existe' }), income(5000, '2026-11-01', { categoryId: 'exp-ocio' })],
      budgets: [],
      goals: [],
    });
    expect(data?.transactions.map((tx) => tx.categoryId)).toEqual(['exp-otros', 'inc-otros']);
  });

  it('siempre incluye las categorías del sistema', () => {
    const data = sanitizeAppData({ categories: [], transactions: [], budgets: [], goals: [] });
    const system = data?.categories.filter((item) => item.system).map((item) => item.id);
    expect(system).toEqual(expect.arrayContaining(['exp-ahorro', 'exp-otros', 'inc-otros']));
  });

  it('deja un único presupuesto por categoría y mes, y solo para categorías de gasto', () => {
    const data = sanitizeAppData({
      categories: [category('exp-ocio', 'Ocio', 'expense'), category('inc-sueldo', 'Sueldo', 'income')],
      transactions: [],
      budgets: [makeBudget('exp-ocio', '2026-11', 1000), makeBudget('exp-ocio', '2026-11', 2000), makeBudget('inc-sueldo', '2026-11', 500)],
      goals: [],
    });
    expect(data?.budgets.map((budget) => budget.limit)).toEqual([1000]);
  });

  it('elimina ids repetidos y corrige la configuración inválida', () => {
    const tx = expense(1000, '2026-11-10');
    const data = sanitizeAppData({
      categories: [],
      transactions: [tx, { ...tx, amount: 9999 }],
      budgets: [],
      goals: [],
      settings: { currency: 'XYZ', userName: 'Ana' },
    });
    expect(data?.transactions).toHaveLength(1);
    expect(data?.transactions[0].amount).toBe(1000);
    expect(data?.settings).toMatchObject({ currency: 'ARS', userName: 'Ana' });
  });
});

describe('serializeAppData / parseAppData', () => {
  it('guarda y recupera los datos sin pérdidas', () => {
    const data = makeData({
      transactions: [expense(1500.5, '2026-11-10', { notes: 'Con observación' }), income(100_000, '2026-11-01')],
      budgets: [makeBudget('exp-supermercado', '2026-11', 50_000)],
      goals: [makeGoal({ savedAmount: 20_000 })],
      settings: { userName: 'Ana', currency: 'USD', onboarded: true, isDemo: false },
    });
    expect(parseAppData(serializeAppData(data))).toEqual(data);
  });

  it('devuelve null si el texto no es JSON válido', () => {
    expect(parseAppData('{ esto no es json')).toBeNull();
  });
});
