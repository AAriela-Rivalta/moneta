import { Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RecurringExpense } from '@/domain/assistant';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDate } from '@/lib/dates';

export function RecurringExpensesCard({ items, total }: { items: RecurringExpense[]; total: number }) {
  const { format } = useCurrency();

  return (
    <Card className="h-full">
      <CardHeader
        title="Gastos recurrentes detectados"
        description={items.length > 0 ? `≈ ${format(total)} por mes en ${items.length} gastos fijos` : 'Se detectan con al menos 3 meses de registros'}
      />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={Repeat}
            title="Sin gastos recurrentes por ahora"
            description="Cuando un gasto con la misma descripción y un monto similar se repita durante 3 meses, aparecerá acá."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 py-3">
                <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{item.description}</p>
                  <p className="truncate text-xs text-ink-500">
                    {item.categoryName} · {item.monthsDetected} meses · variación {Math.round(item.variation)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900 tabular-nums">{format(item.averageAmount)}</p>
                  {item.paidThisMonth ? (
                    <Badge tone="success" className="mt-0.5">
                      Pagado este mes
                    </Badge>
                  ) : (
                    <p className="text-xs text-ink-500">Próximo: {formatDate(item.nextDate, 'day-month')}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
