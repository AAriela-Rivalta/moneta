import type { Category, ISODate, MonthKey, Transaction, TransactionType } from '@/types/finance';

export interface TransactionFilters {
  search: string;
  type: 'all' | TransactionType;
  categoryId: 'all' | string;
  dateFrom: ISODate | '';
  dateTo: ISODate | '';
}

export type TransactionSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  search: '',
  type: 'all',
  categoryId: 'all',
  dateFrom: '',
  dateTo: '',
};

export const SORT_OPTIONS: ReadonlyArray<{ value: TransactionSort; label: string }> = [
  { value: 'date-desc', label: 'Más recientes primero' },
  { value: 'date-asc', label: 'Más antiguos primero' },
  { value: 'amount-desc', label: 'Mayor monto' },
  { value: 'amount-asc', label: 'Menor monto' },
];

/** Minúsculas y sin tildes, para búsquedas tolerantes. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.type !== 'all' ||
    filters.categoryId !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''
  );
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
  categories: ReadonlyMap<string, Category>,
): Transaction[] {
  const query = normalizeText(filters.search);

  return transactions.filter((tx) => {
    if (filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) return false;
    if (filters.dateFrom && tx.date < filters.dateFrom) return false;
    if (filters.dateTo && tx.date > filters.dateTo) return false;
    if (query) {
      const haystack = normalizeText(`${tx.description} ${tx.notes ?? ''} ${categories.get(tx.categoryId)?.name ?? ''}`);
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortTransactions(transactions: readonly Transaction[], sort: TransactionSort): Transaction[] {
  const byDateDesc = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
  const sorted = [...transactions];
  switch (sort) {
    case 'date-asc':
      return sorted.sort((a, b) => -byDateDesc(a, b));
    case 'amount-desc':
      return sorted.sort((a, b) => b.amount - a.amount || byDateDesc(a, b));
    case 'amount-asc':
      return sorted.sort((a, b) => a.amount - b.amount || byDateDesc(a, b));
    default:
      return sorted.sort(byDateDesc);
  }
}

export function getTransactionsInMonth(transactions: readonly Transaction[], monthKey: MonthKey): Transaction[] {
  return transactions.filter((tx) => tx.date.startsWith(monthKey));
}

/** Últimos movimientos registrados hasta una fecha de corte (inclusive). */
export function getRecentTransactions(transactions: readonly Transaction[], limit: number, until?: ISODate): Transaction[] {
  const source = until ? transactions.filter((tx) => tx.date <= until) : transactions;
  return sortTransactions(source, 'date-desc').slice(0, limit);
}

/** Signo que aplica cada tipo de movimiento al saldo. */
export function signedAmount(tx: Pick<Transaction, 'amount' | 'type'>): number {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}
