import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { Insight } from '@/domain/assistant';
import { cn } from '@/lib/cn';
import { SEVERITY_UI } from '../insightUi';

interface InsightCardProps {
  insight: Insight;
  compact?: boolean;
}

export function InsightCard({ insight, compact }: InsightCardProps) {
  const ui = SEVERITY_UI[insight.severity];
  const Icon = ui.icon;

  return (
    <article className={cn('flex gap-3', compact ? 'py-3' : 'rounded-2xl border border-cream-300/70 bg-white p-4 shadow-card sm:p-5')}>
      <span className={cn('flex shrink-0 items-center justify-center rounded-xl', compact ? 'size-8' : 'size-10', ui.iconClass)}>
        <Icon className={compact ? 'size-4' : 'size-5'} aria-hidden />
        <span className="sr-only">{ui.label}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-900">{insight.title}</h3>
          {insight.highlight && !compact && <span className={cn('shrink-0 text-sm font-bold whitespace-nowrap tabular-nums', ui.accent)}>{insight.highlight}</span>}
        </div>
        <p className={cn('mt-1 text-sm leading-relaxed text-ink-600', compact && 'line-clamp-2')}>{insight.message}</p>
        {insight.action && !compact && (
          <Link to={insight.action.to} className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            {insight.action.label}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}
