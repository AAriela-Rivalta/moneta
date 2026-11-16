import { cn } from '@/lib/cn';

export type ProgressTone = 'brand' | 'warning' | 'coral' | 'success' | 'neutral';

const TONES: Record<ProgressTone, string> = {
  brand: 'bg-brand-500',
  warning: 'bg-amber-500',
  coral: 'bg-coral-500',
  success: 'bg-emerald-500',
  neutral: 'bg-ink-400',
};

interface ProgressBarProps {
  /** Porcentaje (puede superar 100; la barra se limita visualmente). */
  value: number;
  tone?: ProgressTone;
  /** Color personalizado (por ejemplo, el de un objetivo). Tiene prioridad sobre `tone`. */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const HEIGHTS = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' } as const;

export function ProgressBar({ value, tone = 'brand', color, size = 'md', label, className }: ProgressBarProps) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(value, 100))}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-ink-100', HEIGHTS[size], className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', !color && TONES[tone])}
        style={{ width: `${width}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
