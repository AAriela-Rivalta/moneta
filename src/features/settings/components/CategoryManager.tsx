import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { useCategories } from '@/hooks/useCategories';
import { pluralize } from '@/lib/format';
import type { Category, TransactionType } from '@/types/finance';
import { CategoryFormModal } from './CategoryFormModal';

const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Gastos' },
  { value: 'income' as const, label: 'Ingresos' },
];

export function CategoryManager() {
  const { data, actions } = useAppData();
  const { expenseCategories, incomeCategories } = useCategories();
  const toast = useToast();
  const [type, setType] = useState<TransactionType>('expense');
  const [form, setForm] = useState<{ category?: Category } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const usage = useMemo(() => {
    const counts = new Map<string, { transactions: number; budgets: number }>();
    for (const tx of data.transactions) {
      const entry = counts.get(tx.categoryId) ?? { transactions: 0, budgets: 0 };
      entry.transactions += 1;
      counts.set(tx.categoryId, entry);
    }
    for (const budget of data.budgets) {
      const entry = counts.get(budget.categoryId) ?? { transactions: 0, budgets: 0 };
      entry.budgets += 1;
      counts.set(budget.categoryId, entry);
    }
    return counts;
  }, [data.transactions, data.budgets]);

  const list = type === 'expense' ? expenseCategories : incomeCategories;
  const deletingUsage = deleting ? (usage.get(deleting.id) ?? { transactions: 0, budgets: 0 }) : null;
  const fallbackName = type === 'expense' ? 'Otros gastos' : 'Otros ingresos';

  const confirmDelete = () => {
    if (!deleting) return;
    actions.deleteCategory(deleting.id);
    toast.success('Categoría eliminada', deleting.name);
    setDeleting(null);
  };

  return (
    <Card>
      <CardHeader
        title="Categorías"
        description="Organizá tus ingresos y gastos con categorías propias"
        action={
          <Button size="sm" icon={Plus} onClick={() => setForm({})}>
            Nueva
          </Button>
        }
      />
      <CardBody>
        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} ariaLabel="Tipo de categoría" />
        <ul className="mt-4 divide-y divide-ink-100">
          {list.map((category) => {
            const count = usage.get(category.id)?.transactions ?? 0;
            return (
              <li key={category.id} className="flex items-center gap-3 py-3">
                <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-ink-900">
                    <span className="truncate">{category.name}</span>
                    {category.system && (
                      <Badge tone="neutral" icon={Lock}>
                        Sistema
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-ink-500">{pluralize(count, 'movimiento')}</p>
                </div>
                <Button variant="ghost" size="icon-sm" icon={Pencil} onClick={() => setForm({ category })} aria-label={`Editar ${category.name}`} />
                <Button
                  variant="ghost-danger"
                  size="icon-sm"
                  icon={Trash2}
                  onClick={() => setDeleting(category)}
                  disabled={category.system}
                  title={category.system ? 'Las categorías del sistema no se pueden eliminar' : undefined}
                  aria-label={`Eliminar ${category.name}`}
                />
              </li>
            );
          })}
        </ul>
      </CardBody>

      {form && <CategoryFormModal key={form.category?.id ?? 'new'} category={form.category} initialType={type} onClose={() => setForm(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar esta categoría?"
        message={
          deleting &&
          deletingUsage && (
            <>
              Se eliminará <strong className="text-ink-900">“{deleting.name}”</strong>.
              {deletingUsage.transactions > 0 && ` ${pluralize(deletingUsage.transactions, 'movimiento')} pasarán a “${fallbackName}”.`}
              {deletingUsage.budgets > 0 && ` También se eliminarán ${pluralize(deletingUsage.budgets, 'presupuesto')} asociados.`}
            </>
          )
        }
        confirmLabel="Eliminar"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
