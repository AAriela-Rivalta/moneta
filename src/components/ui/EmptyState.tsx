import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      <span className={cn('flex items-center justify-center rounded-2xl bg-cream-100 text-brand-600 ring-1 ring-cream-300', compact ? 'size-11' : 'size-14')}>
        <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden />
      </span>
      <h3 className={cn('font-semibold text-ink-900', compact ? 'mt-3 text-sm' : 'mt-4 text-base')}>{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className={compact ? 'mt-4' : 'mt-5'}>{action}</div>}
    </div>
  );
}
