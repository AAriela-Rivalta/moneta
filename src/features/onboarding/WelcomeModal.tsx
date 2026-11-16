import { CheckCircle2, FlaskConical, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { LogoMark } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { cn } from '@/lib/cn';

type StartMode = 'demo' | 'clean';

const OPTIONS: Array<{ value: StartMode; title: string; description: string; icon: typeof Sparkles }> = [
  {
    value: 'demo',
    title: 'Explorar con datos de demostración',
    description: 'Seis meses de movimientos, presupuestos y objetivos de ejemplo. Podés borrarlos cuando quieras.',
    icon: FlaskConical,
  },
  {
    value: 'clean',
    title: 'Empezar con una cuenta limpia',
    description: 'Sin datos previos: cargás tus propios ingresos y gastos desde cero.',
    icon: Sparkles,
  },
];

/** Pantalla de bienvenida del primer uso. */
export function WelcomeModal() {
  const { data, actions } = useAppData();
  const toast = useToast();
  const [name, setName] = useState(data.settings.userName);
  const [mode, setMode] = useState<StartMode>('demo');

  const finish = (selected: StartMode) => {
    const userName = name.trim().slice(0, 40);
    if (selected === 'clean') {
      actions.startCleanAccount({ userName });
      toast.success(`¡Bienvenido/a${userName ? `, ${userName}` : ''}!`, 'Tu cuenta está lista. Registrá tu primer movimiento.');
    } else {
      actions.updateSettings({ userName, onboarded: true });
      toast.success(`¡Bienvenido/a${userName ? `, ${userName}` : ''}!`, 'Estás viendo datos de demostración.');
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    finish(mode);
  };

  return (
    <Modal
      open
      onClose={() => finish('demo')}
      title={
        <span className="flex items-center gap-3">
          <LogoMark className="size-8" />
          Te damos la bienvenida a Moneta
        </span>
      }
      description="Tu administrador inteligente de finanzas personales."
      footer={
        <Button type="submit" form="welcome-form" className="sm:min-w-36">
          Comenzar
        </Button>
      }
    >
      <form id="welcome-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="¿Cómo te llamás?" htmlFor="welcome-name" hint="Opcional. Lo usamos para saludarte en el dashboard.">
          <TextInput id="welcome-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" maxLength={40} autoFocus />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-700">¿Cómo querés empezar?</legend>
          <div className="grid gap-3">
            {OPTIONS.map((option) => {
              const selected = option.value === mode;
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                    selected ? 'border-brand-400 bg-brand-50/60 ring-4 ring-brand-100' : 'border-ink-200 hover:border-ink-300 hover:bg-cream-50',
                  )}
                >
                  <input type="radio" name="start-mode" value={option.value} checked={selected} onChange={() => setMode(option.value)} className="sr-only" />
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600')}>
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">{option.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">{option.description}</span>
                  </span>
                  {selected && <CheckCircle2 className="size-5 shrink-0 text-brand-600" aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="text-xs text-ink-500">Tus datos se guardan únicamente en este navegador. No se envían a ningún servidor.</p>
      </form>
    </Modal>
  );
}
