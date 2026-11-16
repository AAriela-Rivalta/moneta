import { describe, expect, it } from 'vitest';
import { categoryMap, expense, income } from '@/test/factories';
import {
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
  getRecentTransactions,
  hasActiveFilters,
  signedAmount,
  sortTransactions,
  type TransactionFilters,
} from './transactions';

const categories = categoryMap();

const cafe = expense(1200, '2026-11-03', { description: 'Café en el centro', categoryId: 'exp-restaurantes' });
const sueldo = income(500_000, '2026-11-01', { description: 'Sueldo noviembre' });
const nafta = expense(30_000, '2026-10-20', { description: 'Nafta', categoryId: 'exp-transporte', notes: 'Viaje a Córdoba' });
const super_ = expense(45_000, '2026-11-10', { description: 'Supermercado Día', categoryId: 'exp-supermercado' });
const all = [cafe, sueldo, nafta, super_];

const filter = (changes: Partial<TransactionFilters>) => filterTransactions(all, { ...DEFAULT_TRANSACTION_FILTERS, ...changes }, categories);

describe('filterTransactions', () => {
  it('sin filtros devuelve todos los movimientos', () => {
    expect(filter({})).toHaveLength(4);
  });

  it('busca sin distinguir mayúsculas ni tildes', () => {
    expect(filter({ search: 'CAFE' })).toEqual([cafe]);
  });

  it('busca también en las observaciones y en el nombre de la categoría', () => {
    expect(filter({ search: 'cordoba' })).toEqual([nafta]);
    expect(filter({ search: 'transporte' })).toEqual([nafta]);
  });

  it('combina tipo y rango de fechas (inclusive)', () => {
    expect(filter({ type: 'expense', dateFrom: '2026-11-01', dateTo: '2026-11-10' })).toEqual([cafe, super_]);
  });

  it('filtra por categoría', () => {
    expect(filter({ categoryId: 'inc-sueldo' })).toEqual([sueldo]);
  });
});

describe('hasActiveFilters', () => {
  it('ignora una búsqueda con solo espacios', () => {
    expect(hasActiveFilters(DEFAULT_TRANSACTION_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_TRANSACTION_FILTERS, search: '   ' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_TRANSACTION_FILTERS, type: 'income' })).toBe(true);
  });
});

describe('sortTransactions', () => {
  it('ordena por fecha y por monto en ambos sentidos', () => {
    expect(sortTransactions(all, 'date-desc')).toEqual([super_, cafe, sueldo, nafta]);
    expect(sortTransactions(all, 'date-asc')).toEqual([nafta, sueldo, cafe, super_]);
    expect(sortTransactions(all, 'amount-desc')).toEqual([sueldo, super_, nafta, cafe]);
    expect(sortTransactions(all, 'amount-asc')).toEqual([cafe, nafta, super_, sueldo]);
  });

  it('con la misma fecha, muestra primero el último registrado', () => {
    const first = expense(100, '2026-11-05', { createdAt: '2026-11-05T09:00:00.000Z' });
    const second = expense(100, '2026-11-05', { createdAt: '2026-11-05T18:00:00.000Z' });
    expect(sortTransactions([first, second], 'date-desc')).toEqual([second, first]);
  });

  it('no modifica la lista original', () => {
    const copy = [...all];
    sortTransactions(all, 'amount-asc');
    expect(all).toEqual(copy);
  });
});

describe('getRecentTransactions', () => {
  it('devuelve los últimos N movimientos hasta la fecha de corte', () => {
    expect(getRecentTransactions(all, 2, '2026-11-05')).toEqual([cafe, sueldo]);
  });
});

describe('signedAmount', () => {
  it('suma los ingresos y resta los gastos', () => {
    expect(signedAmount(sueldo)).toBe(500_000);
    expect(signedAmount(cafe)).toBe(-1200);
  });
});
