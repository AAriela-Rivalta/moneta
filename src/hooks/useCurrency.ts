import { useCallback } from 'react';
import { useAppData } from '@/context/app-data/useAppData';
import { formatCurrency, type CurrencyFormatOptions } from '@/lib/format';

/** Formateador de montos según la moneda configurada por el usuario. */
export function useCurrency() {
  const { data } = useAppData();
  const { currency } = data.settings;
  const format = useCallback((amount: number, options?: CurrencyFormatOptions) => formatCurrency(amount, currency, options), [currency]);
  return { currency, format };
}
