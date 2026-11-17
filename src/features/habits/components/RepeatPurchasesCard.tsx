import { Repeat } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RepeatPurchase } from '@/domain/habits';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { CurrencyCode } from '@/types/finance';

interface RepeatPurchasesCardProps {
  items: readonly RepeatPurchase[];
  currency: CurrencyCode;
}

export function RepeatPurchasesCard({ items, currency }: RepeatPurchasesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Compras que se repiten"
        description={
          items.length > 0
            ? 'La misma descripción, varias veces, en los últimos tres meses.'
            : 'Hace falta la misma compra al menos cuatro veces y más de una vez y media por mes.'
        }
      />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={Repeat}
            title="No hay compras tan frecuentes"
            description="Cuando una misma descripción se repita seguido dentro de la categoría, va a aparecer en esta lista."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((item) => (
              <li key={item.key} className="py-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900" title={item.description}>
                      {item.description}
                    </p>
                    <p className="truncate text-xs text-ink-500" title={item.categoryName}>
                      {item.categoryName}
                    </p>
                  </div>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  <div className="min-w-16">
                    <dt className="text-xs text-ink-500">Compras</dt>
                    <dd className="text-sm font-semibold text-ink-900 tabular-nums">{formatNumber(item.count)}</dd>
                  </div>
                  <div className="min-w-24">
                    <dt className="text-xs text-ink-500">Ticket promedio</dt>
                    <dd className="text-sm font-semibold break-all text-ink-900 tabular-nums">{formatCurrency(item.averageTicket, currency)}</dd>
                  </div>
                  <div className="min-w-24">
                    <dt className="text-xs text-ink-500">Total</dt>
                    <dd className="text-sm font-semibold break-all text-ink-900 tabular-nums">{formatCurrency(item.total, currency)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
