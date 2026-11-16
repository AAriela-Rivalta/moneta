import { Copy, OctagonAlert, PiggyBank, Plus, TriangleAlert, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { useAppData } from '@/context/app-data/useAppData';
import { usePeriod } from '@/context/period/usePeriod';
import { useToast } from '@/context/toast/useToast';
import { getBudgetAlerts, getBudgetLevel, getBudgetStatuses, getBudgetSummary, getSpentByCategory, type BudgetStatus } from '@/domain/budgets';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import { getMonthLabel, shiftMonth, todayISO } from '@/lib/dates';
import { formatPercent } from '@/lib/format';
import type { Budget } from '@/types/finance';
import { BUDGET_LEVEL_UI } from './budgetUi';
import { BudgetCard } from './components/BudgetCard';
import { BudgetFormModal } from './components/BudgetFormModal';

type FormState = { budget?: Budget; categoryId?: string } | null;

export default function BudgetsPage() {
  const { data, actions } = useAppData();
  const { monthKey } = usePeriod();
  const { categoryMap, expenseCategories } = useCategories();
  const { format } = useCurrency();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<BudgetStatus | null>(null);

  const previousKey = shiftMonth(monthKey, -1);
  const monthLabel = getMonthLabel(monthKey);
  const previousLabel = getMonthLabel(previousKey, 'long').toLowerCase();

  const statuses = useMemo(
    () => getBudgetStatuses(data.budgets, data.transactions, categoryMap, monthKey, todayISO()),
    [data.budgets, data.transactions, categoryMap, monthKey],
  );
  const summary = getBudgetSummary(statuses);
  const alerts = getBudgetAlerts(statuses);

  const copyableCount = useMemo(() => {
    const current = new Set(data.budgets.filter((budget) => budget.month === monthKey).map((budget) => budget.categoryId));
    return data.budgets.filter((budget) => budget.month === previousKey && !current.has(budget.categoryId)).length;
  }, [data.budgets, monthKey, previousKey]);

  const unbudgeted = useMemo(() => {
    const budgeted = new Set(statuses.map((status) => status.budget.categoryId));
    const spent = getSpentByCategory(data.transactions, monthKey);
    return expenseCategories
      .filter((category) => category.id !== SYSTEM_CATEGORY.savings && !budgeted.has(category.id) && (spent.get(category.id) ?? 0) > 0)
      .map((category) => ({ category, spent: spent.get(category.id) ?? 0 }))
      .sort((a, b) => b.spent - a.spent);
  }, [statuses, data.transactions, monthKey, expenseCategories]);

  const handleCopy = () => {
    const copied = actions.copyBudgets(previousKey, monthKey);
    if (copied > 0) toast.success(`Se copiaron ${copied} presupuestos`, `Desde ${previousLabel} a ${monthLabel.toLowerCase()}.`);
    else toast.notify({ tone: 'info', title: 'No hay presupuestos para copiar' });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    actions.deleteBudget(deleting.budget.id);
    toast.success('Presupuesto eliminado', deleting.category?.name);
    setDeleting(null);
  };

  const globalLevel = getBudgetLevel(summary.percentage);

  return (
    <>
      <PageHeader
        title="Presupuestos"
        description="Definí límites de gasto por categoría y controlá su consumo mes a mes."
        actions={
          <>
            <PeriodSelector />
            <Button variant="secondary" icon={Copy} onClick={handleCopy} disabled={copyableCount === 0} title={`Copiar presupuestos de ${previousLabel}`}>
              Copiar de {previousLabel}
            </Button>
            <Button icon={Plus} onClick={() => setForm({})}>
              Nuevo presupuesto
            </Button>
          </>
        }
      />

      {statuses.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title={`No hay presupuestos para ${monthLabel.toLowerCase()}`}
            description="Asigná un límite a las categorías en las que más gastás y recibí alertas al llegar al 80% y al superar el 100%."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button icon={Plus} onClick={() => setForm({})}>
                  Crear presupuesto
                </Button>
                {copyableCount > 0 && (
                  <Button variant="secondary" icon={Copy} onClick={handleCopy}>
                    Copiar {copyableCount} de {previousLabel}
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-sm text-ink-500">Presupuestado</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{format(summary.totalLimit)}</p>
              </div>
              <div>
                <p className="text-sm text-ink-500">Gastado</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{format(summary.totalSpent)}</p>
              </div>
              <div>
                <p className="text-sm text-ink-500">{summary.remaining >= 0 ? 'Disponible' : 'Excedido'}</p>
                <p className={cn('mt-1 text-2xl font-bold tracking-tight', summary.remaining >= 0 ? 'text-brand-700' : 'text-coral-600')}>
                  {format(Math.abs(summary.remaining))}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-ink-700">Consumo total del mes</span>
                <span className="font-semibold text-ink-900 tabular-nums">{formatPercent(summary.percentage)}</span>
              </div>
              <ProgressBar value={summary.percentage} tone={BUDGET_LEVEL_UI[globalLevel].progress} size="lg" label="Consumo total de presupuestos" />
            </div>
          </Card>

          {alerts.length > 0 && (
            <section aria-label="Alertas de presupuesto" className="grid gap-3 md:grid-cols-2">
              {alerts.map((status) => {
                const exceeded = status.level === 'exceeded';
                const Icon = exceeded ? OctagonAlert : TriangleAlert;
                return (
                  <div
                    key={status.budget.id}
                    role="alert"
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4',
                      exceeded ? 'border-coral-200 bg-coral-50/70' : 'border-amber-200 bg-amber-50/70',
                    )}
                  >
                    <Icon className={cn('mt-0.5 size-5 shrink-0', exceeded ? 'text-coral-600' : 'text-amber-600')} aria-hidden />
                    <div className="text-sm">
                      <p className={cn('font-semibold', exceeded ? 'text-coral-800' : 'text-amber-900')}>
                        {status.category?.name}: {exceeded ? 'presupuesto superado' : `${formatPercent(status.percentage)} consumido`}
                      </p>
                      <p className={exceeded ? 'text-coral-700' : 'text-amber-800'}>
                        {exceeded
                          ? `Te excediste por ${format(-status.remaining)} sobre un límite de ${format(status.budget.limit)}.`
                          : `Quedan ${format(Math.max(0, status.remaining))} de ${format(status.budget.limit)}.`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Presupuestos del mes">
            {statuses.map((status) => (
              <BudgetCard key={status.budget.id} status={status} onEdit={() => setForm({ budget: status.budget })} onDelete={() => setDeleting(status)} />
            ))}
          </section>
        </div>
      )}

      {unbudgeted.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Gastos sin presupuesto" description={`Categorías con consumo en ${monthLabel.toLowerCase()} que todavía no tienen límite`} />
          <CardBody>
            <ul className="divide-y divide-ink-100">
              {unbudgeted.map(({ category, spent }) => (
                <li key={category.id} className="flex items-center gap-3 py-3">
                  <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">{category.name}</span>
                  <span className="text-sm font-semibold text-ink-900 tabular-nums">{format(spent)}</span>
                  <Button size="sm" variant="soft" icon={PiggyBank} onClick={() => setForm({ categoryId: category.id })}>
                    <span className="hidden sm:inline">Presupuestar</span>
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {form && (
        <BudgetFormModal
          key={form.budget?.id ?? form.categoryId ?? 'new'}
          monthKey={monthKey}
          budget={form.budget}
          initialCategoryId={form.categoryId}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar este presupuesto?"
        message={deleting && `Se eliminará el límite de ${deleting.category?.name ?? 'esta categoría'} para ${monthLabel.toLowerCase()}. Los movimientos no se modifican.`}
        confirmLabel="Eliminar"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
