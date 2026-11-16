import { FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';

const DISMISS_KEY = 'moneta:demo-banner-hidden';

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function DemoBanner() {
  const { actions } = useAppData();
  const toast = useToast();
  const [hidden, setHidden] = useState(readDismissed);
  const [confirming, setConfirming] = useState(false);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Si no hay sessionStorage, el aviso simplemente vuelve a mostrarse al recargar.
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-100">
          <FlaskConical className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-900">Estás explorando Moneta con datos de demostración</p>
          <p className="text-sm text-brand-800/80">Podés editarlos o eliminarlos libremente. Cuando quieras, empezá con tu propia cuenta.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setConfirming(true)}>
            Empezar de cero
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Ocultar
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="¿Empezar con una cuenta limpia?"
        message="Se eliminarán todos los movimientos, presupuestos y objetivos de demostración. Tus categorías, tu nombre y tu moneda se conservan."
        confirmLabel="Borrar datos de demo"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          actions.startCleanAccount();
          setConfirming(false);
          toast.success('Cuenta limpia lista', 'Registrá tu primer movimiento para empezar.');
        }}
      />
    </>
  );
}
