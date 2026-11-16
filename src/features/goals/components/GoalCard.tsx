import { CalendarClock, CircleCheck, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { assessFeasibility, describeTimeLeft, getGoalProgress, type GoalStatus } from '@/domain/goals';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDate, todayISO } from '@/lib/dates';
import { formatPercent } from '@/lib/format';
import type { SavingsGoal } from '@/types/finance';

const STATUS_UI: Record<GoalStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'En curso', tone: 'brand' },
  completed: { label: 'Cumplido', tone: 'success' },
  overdue: { label: 'Vencido', tone: 'coral' },
};

const FEASIBILITY_TEXT = {
  comfortable: { text: 'Alcanzable con tu ritmo de ahorro actual.', className: 'text-emerald-700' },
  tight: { text: 'Exigente: requiere gran parte de tu capacidad de ahorro.', className: 'text-amber-700' },
  unrealistic: { text: 'Supera tu capacidad de ahorro actual.', className: 'text-coral-600' },
  unknown: { text: 'Registrá más meses para evaluar si es alcanzable.', className: 'text-ink-500' },
} as const;

interface GoalCardProps {
  goal: SavingsGoal;
  /** Capacidad de ahorro mensual promedio del usuario. */
  capacity: number;
  onContribute: (mode: 'deposit' | 'withdraw') => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, capacity, onContribute, onEdit, onDelete }: GoalCardProps) {
  const { format } = useCurrency();
  const progress = getGoalProgress(goal, todayISO());
  const status = STATUS_UI[progress.status];
  const feasibility = FEASIBILITY_TEXT[assessFeasibility(progress.monthlyNeeded, capacity).level];

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon icon={goal.icon} color={goal.color} size="lg" />
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base leading-snug font-semibold text-ink-900" title={goal.name}>
              {goal.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
              <CalendarClock className="size-3.5" aria-hidden />
              {formatDate(goal.deadline)} · {describeTimeLeft(progress.daysLeft)}
            </p>
          </div>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold tracking-tight text-ink-900">{formatPercent(progress.percentage)}</p>
        <p className="pb-1 text-right text-sm text-ink-500">
          <span className="font-semibold text-ink-900">{format(goal.savedAmount)}</span> de {format(goal.targetAmount)}
        </p>
      </div>
      <ProgressBar className="mt-2" value={progress.percentage} color={goal.color} size="lg" label={`Progreso de ${goal.name}`} />

      <div className="mt-4 flex-1 rounded-xl bg-cream-50 p-3 text-sm ring-1 ring-cream-200">
        {progress.status === 'completed' ? (
          <p className="flex items-center gap-2 font-medium text-emerald-700">
            <CircleCheck className="size-4" aria-hidden /> ¡Objetivo cumplido! Reuniste el total.
          </p>
        ) : progress.status === 'overdue' ? (
          <p className="text-coral-700">
            La fecha límite ya pasó y faltan <strong>{format(progress.remaining)}</strong>. Editá el objetivo para extender el plazo.
          </p>
        ) : (
          <>
            <p className="text-ink-700">
              Ahorrá <strong className="text-ink-900">{format(progress.monthlyNeeded)}</strong> por mes durante {progress.monthsLeft}{' '}
              {progress.monthsLeft === 1 ? 'mes' : 'meses'} para llegar a tiempo.
            </p>
            <p className={`mt-1 text-xs ${feasibility.className}`}>{feasibility.text}</p>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" icon={Plus} onClick={() => onContribute('deposit')} disabled={progress.status === 'completed'} className="flex-1">
          Aportar
        </Button>
        <Button size="sm" variant="secondary" icon={Minus} onClick={() => onContribute('withdraw')} disabled={goal.savedAmount <= 0}>
          Retirar
        </Button>
        <Button size="icon-sm" variant="ghost" icon={Pencil} onClick={onEdit} aria-label={`Editar ${goal.name}`} />
        <Button size="icon-sm" variant="ghost-danger" icon={Trash2} onClick={onDelete} aria-label={`Eliminar ${goal.name}`} />
      </div>
    </Card>
  );
}
