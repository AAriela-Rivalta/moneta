import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { createId } from '@/lib/id';
import { ToastContext, type ToastContextValue, type ToastOptions, type ToastTone } from './ToastContext';

interface ToastItem extends ToastOptions {
  id: string;
  tone: ToastTone;
}

const MAX_TOASTS = 4;

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; iconClass: string; bar: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: XCircle, iconClass: 'text-coral-600', bar: 'bg-coral-500' },
  warning: { icon: AlertTriangle, iconClass: 'text-amber-600', bar: 'bg-amber-500' },
  info: { icon: Info, iconClass: 'text-brand-600', bar: 'bg-brand-500' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (options: ToastOptions) => {
      const id = createId('toast');
      const toast: ToastItem = { tone: 'info', ...options, id };
      setToasts((current) => [...current, toast].slice(-MAX_TOASTS));
      const duration = options.duration ?? (options.action ? 6000 : 4000);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (title, description) => notify({ tone: 'success', title, description }),
      error: (title, description) => notify({ tone: 'error', title, description }),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
        >
          {toasts.map((toast) => {
            const style = TONE_STYLES[toast.tone];
            const Icon = style.icon;
            return (
              <div
                key={toast.id}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto relative flex w-full max-w-sm animate-toast-in items-start gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white py-3 pr-3 pl-4 shadow-soft"
              >
                <span className={cn('absolute inset-y-0 left-0 w-1', style.bar)} aria-hidden />
                <Icon className={cn('mt-0.5 size-5 shrink-0', style.iconClass)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
                  {toast.description && <p className="mt-0.5 text-sm text-ink-500">{toast.description}</p>}
                </div>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismiss(toast.id);
                    }}
                    className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                  aria-label="Cerrar notificación"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
