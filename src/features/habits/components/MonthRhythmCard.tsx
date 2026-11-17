import { CalendarRange } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { MonthRhythm } from '@/domain/habits';
import { formatCurrency, formatPercent, pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CurrencyCode } from '@/types/finance';
import { RHYTHM_RANGE, rhythmProgressTone } from '../habitUi';

interface MonthRhythmCardProps {
  rhythm: MonthRhythm;
  currency: CurrencyCode;
}

export function MonthRhythmCard({ rhythm, currency }: MonthRhythmCardProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Ritmo del mes" description="En qué momento del mes se concentra el gasto, sin contar los aportes a ahorro." />
      <CardBody>
        {rhythm.total === 0 ? (
          <EmptyState
            compact
            icon={CalendarRange}
            title="Sin gastos en este mes"
            description="Cuando registres gastos de consumo, vas a ver cuánto salió al inicio, al medio y al cierre del mes."
          />
        ) : (
          <ul className="space-y-4">
            {rhythm.buckets.map((bucket) => {
              const dominant = bucket.id === rhythm.dominant;
              const range = RHYTHM_RANGE[bucket.id];
              return (
                <li key={bucket.id} className={cn('rounded-xl', dominant && 'bg-coral-50 px-3 py-3')}>
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{bucket.label}</p>
                      <p className="text-xs text-ink-500">{range}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {dominant && <Badge tone="coral">Mayor gasto</Badge>}
                      <p className="text-sm font-semibold break-all text-ink-900 tabular-nums">{formatCurrency(bucket.amount, currency)}</p>
                    </div>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    value={bucket.percentage}
                    tone={rhythmProgressTone(bucket.id, rhythm.dominant)}
                    label={`${bucket.label}, ${range}: ${formatPercent(bucket.percentage, 1)} del gasto`}
                  />
                  <p className="mt-1.5 text-xs text-ink-500">
                    {pluralize(bucket.count, 'movimiento')} · {formatPercent(bucket.percentage, 1)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
