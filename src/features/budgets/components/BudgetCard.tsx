import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getBudgetLevelLabel, type BudgetStatus } from '@/domain/budgets';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { BUDGET_LEVEL_UI } from '../budgetUi';

interface BudgetCardProps {
  status: BudgetStatus;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ status, onEdit, onDelete }: BudgetCardProps) {
  const { format } = useCurrency();
  const { category, spent, remaining, percentage, level, budget } = status;
  const name = category?.name ?? 'Sin categoría';
  const ui = BUDGET_LEVEL_UI[level];

  return (
    <Card className={cn('flex flex-col p-5', level === 'exceeded' && 'border-coral-200', level === 'warning' && 'border-amber-200')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon icon={category?.icon ?? 'more'} color={category?.color ?? '#a3a9b1'} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink-900">{name}</h3>
            <Badge tone={ui.badge} className="mt-1">
              {getBudgetLevelLabel(status)}
            </Badge>
          </div>
        </div>
        <div className="-mr-1.5 flex gap-0.5">
          <Button variant="ghost" size="icon-sm" icon={Pencil} onClick={onEdit} aria-label={`Editar presupuesto de ${name}`} />
          <Button variant="ghost-danger" size="icon-sm" icon={Trash2} onClick={onDelete} aria-label={`Eliminar presupuesto de ${name}`} />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-500">Gastado</p>
          <p className="text-xl font-bold tracking-tight text-ink-900">{format(spent)}</p>
        </div>
        <p className="pb-0.5 text-sm text-ink-500">
          de <span className="font-semibold text-ink-700">{format(budget.limit)}</span>
        </p>
      </div>

      <ProgressBar className="mt-3" value={percentage} tone={ui.progress} size="lg" label={`Consumo del presupuesto de ${name}`} />

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className={cn('font-medium', remaining < 0 ? 'text-coral-600' : 'text-ink-700')}>
          {remaining >= 0 ? `Disponible: ${format(remaining)}` : `Excedido por ${format(-remaining)}`}
        </span>
        <span className="font-semibold text-ink-900 tabular-nums">{formatPercent(percentage)}</span>
      </div>
      {status.dailyAllowance !== null && status.daysLeft !== null && (
        <p className="mt-2 text-xs text-ink-500">
          ≈ {format(status.dailyAllowance)} por día durante los próximos {status.daysLeft} días
        </p>
      )}
    </Card>
  );
}
