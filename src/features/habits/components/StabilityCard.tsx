import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CategoryStability } from '@/domain/habits';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/types/finance';
import { STABILITY_LEVELS, STABILITY_UI } from '../habitUi';

interface StabilityCardProps {
  items: readonly CategoryStability[];
  currency: CurrencyCode;
}

export function StabilityCard({ items, currency }: StabilityCardProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Estabilidad por categoría" description="Qué tan parejo fue el gasto de cada categoría en los últimos tres meses." />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={Activity}
            title="Todavía no hay categorías para comparar"
            description="Hace falta gasto en al menos dos de los últimos tres meses. Los aportes a ahorro no se tienen en cuenta."
          />
        ) : (
          <>
            <ul className="divide-y divide-ink-100">
              {items.map((item) => {
                const ui = STABILITY_UI[item.level];
                return (
                  <li key={item.categoryId} className="flex items-center gap-3 py-3">
                    <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs break-all text-ink-500">
                        Promedio mensual: <span className="font-medium text-ink-700 tabular-nums">{formatCurrency(item.mean, currency)}</span>
                      </p>
                    </div>
                    <Badge tone={ui.badge}>{ui.label}</Badge>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-4 space-y-2 border-t border-ink-100 pt-4" aria-label="Qué significa cada clasificación">
              {STABILITY_LEVELS.map((level) => {
                const ui = STABILITY_UI[level];
                return (
                  <li key={level} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone={ui.badge}>{ui.label}</Badge>
                    <p className="min-w-0 text-xs text-ink-500">{ui.description}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  );
}
