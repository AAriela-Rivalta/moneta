import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';

export interface StatDelta {
  /** Variación porcentual; `null` si no hay base de comparación. */
  value: number | null;
  /** Si un aumento es positivo (ingresos) o negativo (gastos). */
  goodWhenPositive: boolean;
  caption: string;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'brand' | 'coral' | 'ink' | 'success';
  delta?: StatDelta;
  footer?: ReactNode;
  /** Variante destacada con fondo de color (para el saldo principal). */
  featured?: boolean;
}

const ICON_TONES = {
  brand: 'bg-brand-50 text-brand-600',
  coral: 'bg-coral-50 text-coral-600',
  ink: 'bg-ink-100 text-ink-700',
  success: 'bg-emerald-50 text-emerald-600',
} as const;

function DeltaBadge({ delta, featured }: { delta: StatDelta; featured?: boolean }) {
  if (delta.value === null) {
    return <span className={cn('text-xs', featured ? 'text-brand-100' : 'text-ink-500')}>Sin datos para comparar · {delta.caption}</span>;
  }
  const rounded = Math.round(delta.value * 10) / 10;
  const isNeutral = rounded === 0;
  const isGood = delta.goodWhenPositive ? rounded > 0 : rounded < 0;
  const Icon = isNeutral ? Minus : rounded > 0 ? ArrowUpRight : ArrowDownRight;
  const tone = featured
    ? 'bg-white/15 text-white'
    : isNeutral
      ? 'bg-ink-100 text-ink-600'
      : isGood
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-coral-50 text-coral-700';

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold', tone)}>
        <Icon className="size-3.5" aria-hidden />
        {formatPercent(Math.abs(rounded), 1)}
      </span>
      <span className={cn('text-xs', featured ? 'text-brand-100' : 'text-ink-500')}>{delta.caption}</span>
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', delta, footer, featured }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-5 shadow-card',
        featured ? 'border-brand-700 bg-brand-700 text-white' : 'border-cream-300/70 bg-white',
      )}
    >
      {featured && <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-white/[0.07]" aria-hidden />}
      <div className="flex items-center justify-between gap-3">
        <p className={cn('text-sm font-medium', featured ? 'text-brand-100' : 'text-ink-500')}>{label}</p>
        <span className={cn('flex size-9 items-center justify-center rounded-xl', featured ? 'bg-white/15 text-white' : ICON_TONES[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className={cn('mt-3 text-2xl font-bold tracking-tight break-all sm:text-[26px]', featured ? 'text-white' : 'text-ink-900')}>{value}</p>
      <div className="mt-2 min-h-5">
        {delta && <DeltaBadge delta={delta} featured={featured} />}
        {footer}
      </div>
    </div>
  );
}
