import { useContext } from 'react';
import { PeriodContext } from './PeriodContext';

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) throw new Error('usePeriod debe usarse dentro de <PeriodProvider>.');
  return context;
}
