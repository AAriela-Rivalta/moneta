import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="size-7 animate-spin text-brand-500" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
