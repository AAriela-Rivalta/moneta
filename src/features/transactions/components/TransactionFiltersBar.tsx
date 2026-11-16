import { ArrowDownUp, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SelectInput, TextInput } from '@/components/ui/FormControls';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SORT_OPTIONS, hasActiveFilters, type TransactionFilters, type TransactionSort } from '@/domain/transactions';
import { getMonthBounds, getMonthKey, shiftMonth, todayISO, addDays } from '@/lib/dates';
import type { Category } from '@/types/finance';

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  sort: TransactionSort;
  expenseCategories: Category[];
  incomeCategories: Category[];
  onChange: (changes: Partial<TransactionFilters>) => void;
  onSortChange: (sort: TransactionSort) => void;
  onReset: () => void;
}

const TYPE_OPTIONS = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'income' as const, label: 'Ingresos' },
  { value: 'expense' as const, label: 'Gastos' },
];

type DatePreset = 'current-month' | 'previous-month' | 'last-30' | 'current-year';

function presetRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = todayISO();
  const currentMonth = getMonthKey(today);
  switch (preset) {
    case 'previous-month': {
      const bounds = getMonthBounds(shiftMonth(currentMonth, -1));
      return { dateFrom: bounds.start, dateTo: bounds.end };
    }
    case 'last-30':
      return { dateFrom: addDays(today, -29), dateTo: today };
    case 'current-year':
      return { dateFrom: `${today.slice(0, 4)}-01-01`, dateTo: `${today.slice(0, 4)}-12-31` };
    default: {
      const bounds = getMonthBounds(currentMonth);
      return { dateFrom: bounds.start, dateTo: bounds.end };
    }
  }
}

export function TransactionFiltersBar({
  filters,
  sort,
  expenseCategories,
  incomeCategories,
  onChange,
  onSortChange,
  onReset,
}: TransactionFiltersBarProps) {
  const changeType = (type: TransactionFilters['type']) => {
    const keepCategory =
      filters.categoryId === 'all' ||
      type === 'all' ||
      (type === 'income' ? incomeCategories : expenseCategories).some((category) => category.id === filters.categoryId);
    onChange({ type, ...(keepCategory ? {} : { categoryId: 'all' }) });
  };

  const showIncome = filters.type !== 'expense';
  const showExpense = filters.type !== 'income';

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <TextInput
            id="tx-search"
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Buscar por descripción, observación o categoría…"
            className="pl-10"
            aria-label="Buscar movimientos"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl options={TYPE_OPTIONS} value={filters.type} onChange={changeType} ariaLabel="Filtrar por tipo" />
          <div className="flex items-center gap-2">
            <ArrowDownUp className="size-4 text-ink-400" aria-hidden />
            <SelectInput aria-label="Ordenar" value={sort} onChange={(event) => onSortChange(event.target.value as TransactionSort)} className="w-52">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <SelectInput aria-label="Filtrar por categoría" value={filters.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
          <option value="all">Todas las categorías</option>
          {showIncome && (
            <optgroup label="Ingresos">
              {incomeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          )}
          {showExpense && (
            <optgroup label="Gastos">
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          )}
        </SelectInput>
        <SelectInput
          aria-label="Período rápido"
          value=""
          onChange={(event) => event.target.value && onChange(presetRange(event.target.value as DatePreset))}
        >
          <option value="">Período rápido…</option>
          <option value="current-month">Este mes</option>
          <option value="previous-month">Mes anterior</option>
          <option value="last-30">Últimos 30 días</option>
          <option value="current-year">Este año</option>
        </SelectInput>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          <span className="w-12 shrink-0 lg:w-auto">Desde</span>
          <TextInput type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(event) => onChange({ dateFrom: event.target.value })} />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          <span className="w-12 shrink-0 lg:w-auto">Hasta</span>
          <TextInput type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(event) => onChange({ dateTo: event.target.value })} />
        </label>
        <Button variant="ghost" icon={X} onClick={onReset} disabled={!hasActiveFilters(filters)}>
          Limpiar
        </Button>
      </div>
    </Card>
  );
}
