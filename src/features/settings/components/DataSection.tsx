import { Download, Eraser, FlaskConical, HardDrive, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { todayISO } from '@/lib/dates';
import { formatNumber, pluralize } from '@/lib/format';
import { parseAppData, serializeAppData } from '@/lib/storage';
import type { AppData } from '@/types/finance';

type PendingAction = { kind: 'demo' } | { kind: 'clean' } | { kind: 'import'; data: AppData };

export function DataSection() {
  const { data, actions } = useAppData();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const sizeKb = new Blob([serializeAppData(data)]).size / 1024;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneta-respaldo-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Respaldo descargado', link.download);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande', 'El tamaño máximo es 5 MB.');
      return;
    }
    const parsed = parseAppData(await file.text());
    if (!parsed) {
      toast.error('No se pudo importar el archivo', 'Verificá que sea un respaldo válido exportado desde Moneta.');
      return;
    }
    setPending({ kind: 'import', data: parsed });
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'demo') {
      actions.loadDemoData();
      toast.success('Datos de demostración restablecidos');
    } else if (pending.kind === 'clean') {
      actions.startCleanAccount();
      toast.success('Se eliminaron todos los datos', 'Tu cuenta está limpia.');
    } else {
      actions.importData(pending.data);
      toast.success('Respaldo importado', `${pluralize(pending.data.transactions.length, 'movimiento')} cargados.`);
    }
    setPending(null);
  };

  const dialog = {
    demo: {
      title: '¿Restablecer los datos de demostración?',
      message: 'Se reemplazarán todos tus movimientos, presupuestos, objetivos y categorías por los datos de ejemplo. Tu nombre y moneda se conservan.',
      label: 'Restablecer demo',
    },
    clean: {
      title: '¿Eliminar todos los datos?',
      message: 'Se borrarán todos los movimientos, presupuestos y objetivos. Esta acción no se puede deshacer: te recomendamos exportar un respaldo antes.',
      label: 'Eliminar todo',
    },
    import: {
      title: '¿Importar este respaldo?',
      message:
        pending?.kind === 'import'
          ? `Se reemplazarán los datos actuales por ${pluralize(pending.data.transactions.length, 'movimiento')}, ${pluralize(pending.data.budgets.length, 'presupuesto')} y ${pluralize(pending.data.goals.length, 'objetivo')}.`
          : '',
      label: 'Importar',
    },
  } as const;

  const current = pending ? dialog[pending.kind] : null;

  return (
    <Card>
      <CardHeader title="Datos" description="Todo se guarda localmente en este navegador (localStorage)" />
      <CardBody className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl bg-cream-50 p-3 text-sm ring-1 ring-cream-200">
          <HardDrive className="size-5 shrink-0 text-ink-500" aria-hidden />
          <p className="text-ink-600">
            {pluralize(data.transactions.length, 'movimiento')} · {pluralize(data.budgets.length, 'presupuesto')} · {pluralize(data.goals.length, 'objetivo')} ·{' '}
            {pluralize(data.categories.length, 'categoría')} <span className="text-ink-400">({formatNumber(sizeKb, 1)} KB)</span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" icon={Download} onClick={exportData}>
            Exportar respaldo
          </Button>
          <Button variant="secondary" icon={Upload} onClick={() => fileInput.current?.click()}>
            Importar respaldo
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
        </div>

        <div className="space-y-3 border-t border-ink-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">Restablecer datos de demostración</p>
              <p className="text-sm text-ink-500">Carga 6 meses de movimientos, presupuestos y objetivos de ejemplo.</p>
            </div>
            <Button variant="soft" icon={FlaskConical} onClick={() => setPending({ kind: 'demo' })}>
              Restablecer demo
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">Comenzar con una cuenta limpia</p>
              <p className="text-sm text-ink-500">Elimina movimientos, presupuestos y objetivos. Conserva tus categorías.</p>
            </div>
            <Button variant="danger" icon={Eraser} onClick={() => setPending({ kind: 'clean' })}>
              Borrar datos
            </Button>
          </div>
        </div>
      </CardBody>

      <ConfirmDialog
        open={Boolean(current)}
        title={current?.title ?? ''}
        message={current?.message}
        confirmLabel={current?.label}
        tone={pending?.kind === 'import' ? 'primary' : 'danger'}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </Card>
  );
}
