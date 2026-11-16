import { useMemo, useState, type ReactNode } from 'react';
import { currentMonthKey } from '@/lib/dates';
import { PeriodContext, type PeriodContextValue } from './PeriodContext';

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  const value = useMemo<PeriodContextValue>(
    () => ({ monthKey, setMonthKey, isCurrentMonth: monthKey === currentMonthKey() }),
    [monthKey],
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}
