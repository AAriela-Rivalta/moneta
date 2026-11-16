import { useMemo } from 'react';
import { useAppData } from '@/context/app-data/useAppData';
import { generateAssistantReport } from '@/domain/assistant';
import { todayISO } from '@/lib/dates';
import type { MonthKey } from '@/types/finance';

/** Reporte del asistente recalculado automáticamente ante cualquier cambio de datos. */
export function useAssistantReport(monthKey: MonthKey) {
  const { data } = useAppData();
  return useMemo(() => generateAssistantReport(data, monthKey, todayISO()), [data, monthKey]);
}
