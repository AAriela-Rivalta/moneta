import { PiggyBank, StickyNote } from 'lucide-react';
import type { ReactNode } from 'react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatDate } from '@/lib/dates';
import type { Category, Transaction } from '@/types/finance';
import { AmountText } from './AmountText';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  actions?: ReactNode;
}

export function TransactionItem({ transaction, category, actions }: TransactionItemProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <CategoryIcon icon={category?.icon ?? 'more'} color={category?.color ?? '#a3a9b1'} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900">
          <span className="truncate">{transaction.description}</span>
          {transaction.notes && <StickyNote className="size-3.5 shrink-0 text-ink-400" aria-label="Tiene observaciones" />}
          {transaction.goalId && <PiggyBank className="size-3.5 shrink-0 text-ink-400" aria-label="Vinculado a un objetivo" />}
        </p>
        <p className="truncate text-xs text-ink-500">
          {category?.name ?? 'Sin categoría'} · {formatDate(transaction.date)}
        </p>
      </div>
      <AmountText amount={transaction.amount} type={transaction.type} className="text-sm" />
      {actions}
    </div>
  );
}
