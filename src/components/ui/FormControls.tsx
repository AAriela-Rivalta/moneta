import { AlertCircle, ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const BASE =
  'block w-full rounded-xl border bg-white text-sm text-ink-900 shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-400 focus:ring-4 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400';
const STATE = {
  normal: 'border-ink-200 hover:border-ink-300 focus:border-brand-400 focus:ring-brand-100',
  invalid: 'border-coral-400 focus:border-coral-500 focus:ring-coral-100',
};

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="text-coral-500"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 flex items-start gap-1 text-xs font-medium text-coral-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
}

interface ControlProps {
  invalid?: boolean;
}

export function TextInput({ invalid, className, id, ...props }: ComponentProps<'input'> & ControlProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={cn(BASE, invalid ? STATE.invalid : STATE.normal, 'h-10 px-3.5', className)}
      {...props}
    />
  );
}

export function SelectInput({ invalid, className, id, children, ...props }: ComponentProps<'select'> & ControlProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? `${id}-error` : undefined}
        className={cn(BASE, invalid ? STATE.invalid : STATE.normal, 'h-10 cursor-pointer appearance-none pr-9 pl-3.5')}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
    </div>
  );
}

export function TextArea({ invalid, className, id, ...props }: ComponentProps<'textarea'> & ControlProps) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={cn(BASE, invalid ? STATE.invalid : STATE.normal, 'min-h-20 resize-y px-3.5 py-2.5', className)}
      {...props}
    />
  );
}
