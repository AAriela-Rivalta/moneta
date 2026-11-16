import { RefreshCw, TriangleAlert } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '@/components/ui/Button';

/** Pantalla de respaldo ante errores inesperados de renderizado o navegación. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} · ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Error desconocido';

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-cream-300 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
          <TriangleAlert className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink-900">Algo salió mal</h1>
        <p className="mt-1 text-sm text-ink-500">Ocurrió un error inesperado. Tus datos siguen guardados en este navegador.</p>
        <p className="mt-4 rounded-lg bg-ink-50 px-3 py-2 font-mono text-xs break-words text-ink-600">{message}</p>
        <Button className="mt-6" icon={RefreshCw} onClick={() => window.location.assign('/')}>
          Volver a cargar
        </Button>
      </div>
    </div>
  );
}
