import { Pencil, PiggyBank, StickyNote, Trash2 } from 'lucide-react';
import { AmountText } from '@/components/shared/AmountText';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatDate } from '@/lib/dates';
import type { Category, Transaction } from '@/types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: ReadonlyMap<string, Category>;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

function RowActions({ transaction, onEdit, onDelete }: { transaction: Transaction } & Pick<TransactionTableProps, 'onEdit' | 'onDelete'>) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" icon={Pencil} onClick={() => onEdit(transaction)} aria-label={`Editar ${transaction.description}`} />
      <Button variant="ghost-danger" size="icon-sm" icon={Trash2} onClick={() => onDelete(transaction)} aria-label={`Eliminar ${transaction.description}`} />
    </div>
  );
}

export function TransactionTable({ transactions, categories, onEdit, onDelete }: TransactionTableProps) {
  return (
    <>
      {/* Escritorio y tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <th scope="col" className="px-5 py-3 font-semibold">
                Fecha
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Descripción
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Categoría
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Tipo
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                Monto
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {transactions.map((tx) => {
              const category = categories.get(tx.categoryId);
              return (
                <tr key={tx.id} className="group transition-colors hover:bg-cream-50">
                  <td className="px-5 py-3 whitespace-nowrap text-ink-600 tabular-nums">{formatDate(tx.date)}</td>
                  <td className="max-w-xs px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-ink-900">{tx.description}</span>
                      {tx.goalId && <PiggyBank className="size-3.5 shrink-0 text-ink-400" aria-label="Vinculado a un objetivo" />}
                    </div>
                    {tx.notes && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-500" title={tx.notes}>
                        <StickyNote className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{tx.notes}</span>
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={category?.icon ?? 'more'} color={category?.color ?? '#a3a9b1'} size="sm" />
                      <span className="truncate text-ink-700">{category?.name ?? 'Sin categoría'}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={tx.type === 'income' ? 'brand' : 'coral'}>{tx.type === 'income' ? 'Ingreso' : 'Gasto'}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <AmountText amount={tx.amount} type={tx.type} />
                  </td>
                  <td className="px-5 py-3">
                    <RowActions transaction={tx} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Celular */}
      <div className="divide-y divide-ink-100 px-4 md:hidden">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            category={categories.get(tx.categoryId)}
            actions={<RowActions transaction={tx} onEdit={onEdit} onDelete={onDelete} />}
          />
        ))}
      </div>
    </>
  );
}
