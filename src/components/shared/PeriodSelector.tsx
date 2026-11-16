import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useAppData } from '@/context/app-data/useAppData';
import { usePeriod } from '@/context/period/usePeriod';
import { cn } from '@/lib/cn';
import { MONTH_NAMES, currentMonthKey, makeMonthKey, parseMonthKey, shiftMonth } from '@/lib/dates';

const selectClass =
  'h-8 cursor-pointer appearance-none rounded-lg bg-transparent px-2 text-sm font-semibold text-ink-800 hover:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300';
const arrowClass =
  'flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900';

/** Filtro global de mes y año, compartido entre pantallas. */
export function PeriodSelector({ className }: { className?: string }) {
  const { monthKey, setMonthKey, isCurrentMonth } = usePeriod();
  const { data } = useAppData();
  const { year, monthIndex } = parseMonthKey(monthKey);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    let min = current - 1;
    for (const tx of data.transactions) min = Math.min(min, Number(tx.date.slice(0, 4)));
    const from = Math.min(min, year);
    const to = Math.max(current + 1, year);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [data.transactions, year]);

  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-xl border border-ink-200 bg-white p-1 shadow-xs', className)}>
      <button type="button" className={arrowClass} onClick={() => setMonthKey(shiftMonth(monthKey, -1))} aria-label="Mes anterior">
        <ChevronLeft className="size-4" />
      </button>
      <select
        aria-label="Mes"
        className={selectClass}
        value={monthIndex}
        onChange={(event) => setMonthKey(makeMonthKey(year, Number(event.target.value)))}
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index}>
            {name}
          </option>
        ))}
      </select>
      <select aria-label="Año" className={selectClass} value={year} onChange={(event) => setMonthKey(makeMonthKey(Number(event.target.value), monthIndex))}>
        {years.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button type="button" className={arrowClass} onClick={() => setMonthKey(shiftMonth(monthKey, 1))} aria-label="Mes siguiente">
        <ChevronRight className="size-4" />
      </button>
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={() => setMonthKey(currentMonthKey())}
          className="ml-0.5 h-8 rounded-lg bg-brand-50 px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
