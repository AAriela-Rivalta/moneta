import { APP_NAME } from '@/config/constants';
import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9', className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#1f78ad" />
      <path d="M17 45V22l15 14 15-14v23" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="14" r="5" fill="#ec5f47" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-xl font-bold tracking-tight text-ink-900">{APP_NAME}</span>
    </span>
  );
}
