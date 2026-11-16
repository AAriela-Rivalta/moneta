import { ArrowDownRight, ArrowUpRight, ChartColumnBig, Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PeriodComparisonChart } from '@/components/charts/PeriodComparisonChart';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectInput } from '@/components/ui/FormControls';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { useAppData } from '@/context/app-data/useAppData';
import { compareCategories, getTotals } from '@/domain/statistics';
import { getTransactionsInMonth } from '@/domain/transactions';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import { currentMonthKey, getMonthLabel, monthDiff, monthRange, shiftMonth } from '@/lib/dates';
import { formatPercent } from '@/lib/format';
import { percentChange } from '@/lib/math';
import type { MonthKey } from '@/types/finance';

function ChangeLabel({ value, goodWhenPositive }: { value: number | null; goodWhenPositive: boolean }) {
  if (value === null) return <span className="text-xs text-ink-400">—</span>;
  const rounded = Math.round(value);
  const Icon = rounded === 0 ? Minus : rounded > 0 ? ArrowUpRight : ArrowDownRight;
  const good = goodWhenPositive ? rounded > 0 : rounded < 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums', rounded === 0 ? 'text-ink-500' : good ? 'text-emerald-700' : 'text-coral-600')}>
      <Icon className="size-3.5" aria-hidden />
      {formatPercent(Math.abs(value), 0)}
    </span>
  );
}

/** Comparación libre entre dos meses: totales y gasto por categoría. */
export function PeriodComparisonSection({ selectedMonth }: { selectedMonth: MonthKey }) {
  const { data } = useAppData();
  const { categoryMap } = useCategories();
  const { format } = useCurrency();
  const [monthA, setMonthA] = useState<MonthKey | null>(null);
  const [monthB, setMonthB] = useState<MonthKey | null>(null);

  const periodA = monthA ?? selectedMonth;
  const periodB = monthB ?? shiftMonth(selectedMonth, -1);

  const monthOptions = useMemo(() => {
    const latest = [currentMonthKey(), selectedMonth].sort().at(-1)!;
    const earliest = data.transactions.reduce((min, tx) => (tx.date.slice(0, 7) < min ? tx.date.slice(0, 7) : min), shiftMonth(latest, -11));
    return monthRange(latest, monthDiff(earliest, latest) + 1).reverse();
  }, [data.transactions, selectedMonth]);

  const comparison = useMemo(() => {
    const txA = getTransactionsInMonth(data.transactions, periodA);
    const txB = getTransactionsInMonth(data.transactions, periodB);
    const withoutSavings = (list: typeof txA) => list.filter((tx) => tx.categoryId !== SYSTEM_CATEGORY.savings);
    return {
      totalsA: getTotals(txA),
      totalsB: getTotals(txB),
      categories: compareCategories(withoutSavings(txA), withoutSavings(txB), categoryMap, 'expense'),
    };
  }, [data.transactions, periodA, periodB, categoryMap]);

  const labelA = getMonthLabel(periodA, 'short-year');
  const labelB = getMonthLabel(periodB, 'short-year');
  const { totalsA, totalsB } = comparison;
  const rows = [
    { label: 'Ingresos', a: totalsA.income, b: totalsB.income, good: true },
    { label: 'Gastos', a: totalsA.expense, b: totalsB.expense, good: false },
    { label: 'Balance', a: totalsA.balance, b: totalsB.balance, good: true },
  ];

  return (
    <Card>
      <CardHeader title="Comparación entre períodos" description="Elegí dos meses para comparar ingresos, gastos y categorías" />
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-ink-700">
              <span className="size-2.5 rounded-full bg-coral-500" aria-hidden /> Período principal
            </span>
            <SelectInput value={periodA} onChange={(event) => setMonthA(event.target.value)}>
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {getMonthLabel(key)}
                </option>
              ))}
            </SelectInput>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-ink-700">
              <span className="size-2.5 rounded-full bg-ink-300" aria-hidden /> Comparar con
            </span>
            <SelectInput value={periodB} onChange={(event) => setMonthB(event.target.value)}>
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {getMonthLabel(key)}
                </option>
              ))}
            </SelectInput>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-cream-50 p-4 ring-1 ring-cream-200">
              <p className="text-xs font-medium text-ink-500">{row.label}</p>
              <p className="mt-1 text-lg font-bold tracking-tight text-ink-900">{format(row.a, { signed: row.label === 'Balance' })}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                <ChangeLabel value={percentChange(row.a, row.b)} goodWhenPositive={row.good} />
                vs. {format(row.b, { signed: row.label === 'Balance' })} en {labelB}
              </p>
            </div>
          ))}
        </div>

        {comparison.categories.length === 0 ? (
          <EmptyState compact icon={ChartColumnBig} title="Sin gastos en los períodos elegidos" className="mt-4" />
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <PeriodComparisonChart items={comparison.categories.slice(0, 8)} currentLabel={labelA} previousLabel={labelB} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Categoría
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {labelA}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {labelB}
                    </th>
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">
                      Variación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {comparison.categories.map((item) => (
                    <tr key={item.categoryId}>
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                          <span className="truncate text-ink-700">{item.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-ink-900 tabular-nums">{format(item.current)}</td>
                      <td className="px-3 py-2.5 text-right text-ink-600 tabular-nums">{format(item.previous)}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <ChangeLabel value={item.change} goodWhenPositive={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
