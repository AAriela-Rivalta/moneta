import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import type { TransactionType } from '@/types/finance';

interface AmountTextProps {
  amount: number;
  type: TransactionType;
  className?: string;
}

/** Monto con signo y color según el tipo de movimiento. */
export function AmountText({ amount, type, className }: AmountTextProps) {
  const { format } = useCurrency();
  return (
    <span className={cn('font-semibold whitespace-nowrap tabular-nums', type === 'income' ? 'text-brand-700' : 'text-coral-600', className)}>
      {format(type === 'income' ? amount : -amount, { signed: true })}
    </span>
  );
}
