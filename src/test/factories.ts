import { cloneDefaultCategories } from '@/data/defaultCategories';
import { createEmptyData } from '@/data/initialState';
import type { AppData, Budget, Category, SavingsGoal, Transaction } from '@/types/finance';

/**
 * Constructores de datos para las pruebas. Cada uno arma un objeto válido con valores
 * por defecto razonables, así cada prueba solo declara lo que le importa.
 */

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const date = overrides.date ?? '2026-11-10';
  return {
    id: nextId('tx'),
    description: 'Movimiento de prueba',
    amount: 1000,
    type: 'expense',
    categoryId: 'exp-supermercado',
    createdAt: `${date}T12:00:00.000Z`,
    ...overrides,
    date,
  };
}

export function expense(amount: number, date: string, overrides: Partial<Transaction> = {}): Transaction {
  return makeTransaction({ amount, date, type: 'expense', ...overrides });
}

export function income(amount: number, date: string, overrides: Partial<Transaction> = {}): Transaction {
  return makeTransaction({ amount, date, type: 'income', categoryId: 'inc-sueldo', description: 'Sueldo', ...overrides });
}

export function makeBudget(categoryId: string, month: string, limit: number, id = nextId('bud')): Budget {
  return { id, categoryId, month, limit };
}

export function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: nextId('goal'),
    name: 'Vacaciones',
    targetAmount: 100_000,
    savedAmount: 0,
    deadline: '2027-05-16',
    icon: 'target',
    color: '#2a78d6',
    createdAt: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}

/** Mapa id → categoría con las categorías por defecto de la app. */
export function categoryMap(categories: Category[] = cloneDefaultCategories()): Map<string, Category> {
  return new Map(categories.map((category) => [category.id, category]));
}

export function makeData(overrides: Partial<AppData> = {}): AppData {
  return { ...createEmptyData({ onboarded: true }), ...overrides };
}
