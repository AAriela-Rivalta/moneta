import { Car, Laptop, Plus, Shield, Target, TreePalm, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { getGoalProgress, getGoalsSummary, type GoalStatus } from '@/domain/goals';
import { getAverageMonthlySavingCapacity } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { currentMonthKey, todayISO } from '@/lib/dates';
import { formatPercent } from '@/lib/format';
import type { SavingsGoal } from '@/types/finance';
import { ContributionModal } from './components/ContributionModal';
import { GoalCard } from './components/GoalCard';
import { GoalFormModal, type GoalTemplate } from './components/GoalFormModal';
import { SavingsSimulator } from './components/SavingsSimulator';

const TEMPLATES: Array<GoalTemplate & { label: string; Icon: LucideIcon }> = [
  { label: 'Vacaciones', name: 'Vacaciones', icon: 'palmtree', color: '#eb6834', Icon: TreePalm },
  { label: 'Vehículo', name: 'Comprar un vehículo', icon: 'car', color: '#2a78d6', Icon: Car },
  { label: 'Computadora', name: 'Computadora nueva', icon: 'laptop', color: '#6250d6', Icon: Laptop },
  { label: 'Fondo de emergencia', name: 'Fondo de emergencia', icon: 'shield', color: '#1baf7a', Icon: Shield },
];

const STATUS_ORDER: Record<GoalStatus, number> = { overdue: 0, active: 1, completed: 2 };

type FormState = { goal?: SavingsGoal; template?: GoalTemplate } | null;

export default function GoalsPage() {
  const { data, actions } = useAppData();
  const { format } = useCurrency();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<FormState>(null);
  const [contribution, setContribution] = useState<{ goalId: string; mode: 'deposit' | 'withdraw' } | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

  const today = todayISO();
  const createFromUrl = searchParams.get('nuevo') === '1';
  const formState: FormState = form ?? (createFromUrl ? {} : null);

  const capacity = useMemo(() => getAverageMonthlySavingCapacity(data.transactions, currentMonthKey()), [data.transactions]);
  const summary = getGoalsSummary(data.goals, today);
  const monthlyRequired = data.goals.reduce((total, goal) => total + getGoalProgress(goal, today).monthlyNeeded, 0);

  const sortedGoals = useMemo(
    () =>
      [...data.goals].sort((a, b) => {
        const statusA = getGoalProgress(a, today).status;
        const statusB = getGoalProgress(b, today).status;
        return STATUS_ORDER[statusA] - STATUS_ORDER[statusB] || a.deadline.localeCompare(b.deadline);
      }),
    [data.goals, today],
  );

  const contributionGoal = contribution ? data.goals.find((goal) => goal.id === contribution.goalId) : undefined;

  const closeForm = () => {
    setForm(null);
    if (createFromUrl) setSearchParams({}, { replace: true });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    actions.deleteGoal(deleting.id);
    toast.success('Objetivo eliminado', deleting.name);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="Objetivos de ahorro"
        description="Definí metas, registrá tus aportes y simulá cuánto necesitás ahorrar."
        actions={
          <Button icon={Plus} onClick={() => setForm({})}>
            Nuevo objetivo
          </Button>
        }
      />

      {data.goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="Todavía no tenés objetivos de ahorro"
            description="Elegí una idea para empezar o creá tu propio objetivo con nombre, monto y fecha límite."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {TEMPLATES.map(({ label, Icon, ...template }) => (
                  <Button key={label} variant="secondary" icon={Icon} onClick={() => setForm({ template })}>
                    {label}
                  </Button>
                ))}
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
              <div>
                <p className="text-sm text-ink-500">Total ahorrado en objetivos</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
                  {format(summary.totalSaved)} <span className="text-base font-medium text-ink-500">de {format(summary.totalTarget)}</span>
                </p>
                <ProgressBar className="mt-3" value={summary.percentage} size="lg" label="Progreso total de objetivos" />
                <p className="mt-1.5 text-xs text-ink-500">{formatPercent(summary.percentage)} del total</p>
              </div>
              <div>
                <p className="text-sm text-ink-500">Objetivos</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{data.goals.length}</p>
                <p className="text-xs text-ink-500">
                  {summary.active} en curso · {summary.completed} cumplidos
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-500">Ahorro mensual requerido</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{format(monthlyRequired)}</p>
                <p className="text-xs text-ink-500">Para cumplir todos a tiempo</p>
              </div>
              <div>
                <p className="text-sm text-ink-500">Tu capacidad de ahorro</p>
                <p className={`mt-1 text-2xl font-bold tracking-tight ${capacity < monthlyRequired ? 'text-coral-600' : 'text-emerald-700'}`}>
                  {format(Math.max(0, capacity))}
                </p>
                <p className="text-xs text-ink-500">Promedio mensual de los últimos 3 meses</p>
              </div>
            </div>
          </Card>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Objetivos">
            {sortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                capacity={capacity}
                onContribute={(mode) => setContribution({ goalId: goal.id, mode })}
                onEdit={() => setForm({ goal })}
                onDelete={() => setDeleting(goal)}
              />
            ))}
          </section>
        </>
      )}

      <div className="mt-6">
        <SavingsSimulator goals={data.goals} capacity={capacity} />
      </div>

      {formState && <GoalFormModal key={formState.goal?.id ?? formState.template?.name ?? 'new'} goal={formState.goal} template={formState.template} onClose={closeForm} />}
      {contribution && contributionGoal && (
        <ContributionModal key={contributionGoal.id} goal={contributionGoal} initialMode={contribution.mode} onClose={() => setContribution(null)} />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar este objetivo?"
        message={
          deleting && (
            <>
              Se eliminará <strong className="text-ink-900">“{deleting.name}”</strong>. Los movimientos de aportes ya registrados se conservan, pero quedarán
              desvinculados del objetivo.
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
