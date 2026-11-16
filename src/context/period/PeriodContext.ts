import { createContext } from 'react';
import type { MonthKey } from '@/types/finance';

export interface PeriodContextValue {
  /** Mes seleccionado (YYYY-MM), compartido por dashboard, presupuestos, estadísticas y asistente. */
  monthKey: MonthKey;
  setMonthKey: (monthKey: MonthKey) => void;
  isCurrentMonth: boolean;
}

export const PeriodContext = createContext<PeriodContextValue | null>(null);
