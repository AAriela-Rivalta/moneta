import { ArrowDownCircle, ArrowUpCircle, ReceiptText, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { getTotals } from '@/domain/statistics';
import {
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
  sortTransactions,
  type TransactionFilters,
  type TransactionSort,
} from '@/domain/transactions';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import { pluralize } from '@/lib/format';
import type { Transaction, TransactionType } from '@/types/finance';
import { TransactionFiltersBar } from './components/TransactionFiltersBar';
import { TransactionFormModal } from './components/TransactionFormModal';
import { TransactionTable } from './components/TransactionTable';

const PAGE_SIZE = 15;
const NEW_PARAM = 'nuevo';

export default function TransactionsPage() {
  const { data, actions } = useAppData();
  const { categoryMap, expenseCategories, incomeCategories } = useCategories();
  const { format } = useCurrency();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [sort, setSort] = useState<TransactionSort>('date-desc');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  // El formulario de alta se abre desde la URL (?nuevo=gasto|ingreso) para poder lanzarlo desde cualquier pantalla.
  const requested = searchParams.get(NEW_PARAM);
  const createType: TransactionType | null = requested === 'ingreso' ? 'income' : requested === 'gasto' ? 'expense' : null;

  const openCreate = (type: TransactionType) => setSearchParams({ [NEW_PARAM]: type === 'income' ? 'ingreso' : 'gasto' });
  const closeCreate = () => {
    const next = new URLSearchParams(searchParams);
    next.delete(NEW_PARAM);
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(
    () => sortTransactions(filterTransactions(data.transactions, filters, categoryMap), sort),
    [data.transactions, filters, categoryMap, sort],
  );
  const totals = useMemo(() => getTotals(filtered), [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateFilters = (changes: Partial<TransactionFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const removed = actions.deleteTransaction(deleting.id);
    setDeleting(null);
    if (removed) {
      toast.notify({
        tone: 'success',
        title: 'Movimiento eliminado',
        description: removed.description,
        action: { label: 'Deshacer', onClick: () => actions.restoreTransaction(removed) },
      });
    }
  };

  const linkedGoal = deleting?.goalId ? data.goals.find((goal) => goal.id === deleting.goalId) : undefined;

  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Registrá, buscá y administrá tus ingresos y gastos."
        actions={
          <>
            <Button variant="soft" icon={ArrowUpCircle} onClick={() => openCreate('income')}>
              Nuevo ingreso
            </Button>
            <Button variant="coral" icon={ArrowDownCircle} onClick={() => openCreate('expense')}>
              Nuevo gasto
            </Button>
          </>
        }
      />

      {data.transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ReceiptText}
            title="Todavía no registraste movimientos"
            description="Empezá cargando tus ingresos y gastos. Todo se guarda automáticamente en este navegador."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="soft" icon={ArrowUpCircle} onClick={() => openCreate('income')}>
                  Registrar ingreso
                </Button>
                <Button variant="coral" icon={ArrowDownCircle} onClick={() => openCreate('expense')}>
                  Registrar gasto
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <TransactionFiltersBar
            filters={filters}
            sort={sort}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            onChange={updateFilters}
            onSortChange={setSort}
            onReset={() => updateFilters(DEFAULT_TRANSACTION_FILTERS)}
          />

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Resultados', value: pluralize(totals.count, 'movimiento'), className: 'text-ink-900' },
              { label: 'Ingresos', value: format(totals.income), className: 'text-brand-700' },
              { label: 'Gastos', value: format(totals.expense), className: 'text-coral-600' },
              { label: 'Balance', value: format(totals.balance, { signed: true }), className: totals.balance < 0 ? 'text-coral-600' : 'text-ink-900' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-cream-300/70 bg-white px-4 py-3 shadow-card">
                <dt className="text-xs font-medium text-ink-500">{item.label}</dt>
                <dd className={cn('mt-0.5 truncate text-base font-semibold tabular-nums', item.className)}>{item.value}</dd>
              </div>
            ))}
          </dl>

          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No hay movimientos que coincidan"
                description="Probá con otra búsqueda o ajustá los filtros aplicados."
                action={
                  <Button variant="secondary" onClick={() => updateFilters(DEFAULT_TRANSACTION_FILTERS)}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <>
                <TransactionTable transactions={pageItems} categories={categoryMap} onEdit={setEditing} onDelete={setDeleting} />
                <div className="border-t border-ink-100 px-5 py-3">
                  <Pagination page={currentPage} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {createType && <TransactionFormModal key={createType} initialType={createType} onClose={closeCreate} />}
      {editing && <TransactionFormModal key={editing.id} transaction={editing} initialType={editing.type} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar este movimiento?"
        message={
          deleting && (
            <>
              Se eliminará <strong className="text-ink-900">“{deleting.description}”</strong> por {format(deleting.amount)}. Los saldos y estadísticas se
              recalcularán automáticamente.
              {linkedGoal && (
                <span className="mt-2 block">
                  Está vinculado al objetivo <strong className="text-ink-900">“{linkedGoal.name}”</strong>: también se ajustará el monto ahorrado.
                </span>
              )}
            </>
          )
        }
        confirmLabel="Eliminar"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
