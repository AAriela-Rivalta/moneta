import { Minus, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { hasErrors, parseAmount, validateContribution, type ContributionFormValues, type FormErrors } from '@/domain/validation';
import { useCurrency } from '@/hooks/useCurrency';
import { isValidISODate, todayISO } from '@/lib/dates';
import type { SavingsGoal } from '@/types/finance';

type Mode = 'deposit' | 'withdraw';

const MODE_OPTIONS = [
  { value: 'deposit' as const, label: 'Aportar', icon: Plus },
  { value: 'withdraw' as const, label: 'Retirar', icon: Minus },
];

interface ContributionModalProps {
  goal: SavingsGoal;
  initialMode: Mode;
  onClose: () => void;
}

export function ContributionModal({ goal, initialMode, onClose }: ContributionModalProps) {
  const { actions } = useAppData();
  const { format } = useCurrency();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState<ContributionFormValues>({ amount: '' });
  const [date, setDate] = useState(todayISO());
  const [registerTransaction, setRegisterTransaction] = useState(true);
  const [errors, setErrors] = useState<FormErrors<ContributionFormValues>>({});

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const amount = parseAmount(values.amount);
  const isDeposit = mode === 'deposit';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateContribution(values, mode, goal);
    setErrors(validation);
    if (hasErrors(validation) || !isValidISODate(date)) return;

    actions.contributeToGoal({ goalId: goal.id, amount, mode, date, registerTransaction });
    toast.success(isDeposit ? 'Aporte registrado' : 'Retiro registrado', `${format(amount)} ${isDeposit ? 'en' : 'de'} ${goal.name}`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={goal.name}
      description={`Ahorrado: ${format(goal.savedAmount)} de ${format(goal.targetAmount)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="contribution-form" variant={isDeposit ? 'primary' : 'coral'}>
            {isDeposit ? 'Registrar aporte' : 'Registrar retiro'}
          </Button>
        </>
      }
    >
      <form id="contribution-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} ariaLabel="Tipo de operación" fullWidth />

        <Field
          label="Monto"
          htmlFor="contribution-amount"
          error={errors.amount}
          required
          hint={isDeposit ? (remaining > 0 ? `Faltan ${format(remaining)} para completar el objetivo.` : undefined) : `Disponible para retirar: ${format(goal.savedAmount)}`}
        >
          <TextInput
            id="contribution-amount"
            inputMode="decimal"
            value={values.amount}
            onChange={(event) => setValues({ amount: event.target.value })}
            placeholder="0"
            invalid={Boolean(errors.amount)}
            autoFocus
            autoComplete="off"
          />
        </Field>
        {isDeposit && remaining > 0 && (
          <Button size="sm" variant="soft" onClick={() => setValues({ amount: String(remaining) })}>
            Completar objetivo ({format(remaining)})
          </Button>
        )}

        <Field label="Fecha" htmlFor="contribution-date" required error={isValidISODate(date) ? undefined : 'Elegí una fecha válida.'}>
          <TextInput id="contribution-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} invalid={!isValidISODate(date)} />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream-50 p-3 ring-1 ring-cream-200">
          <input
            type="checkbox"
            checked={registerTransaction}
            onChange={(event) => setRegisterTransaction(event.target.checked)}
            className="mt-0.5 size-4 accent-brand-600"
          />
          <span className="text-sm">
            <span className="block font-medium text-ink-800">Registrar también como movimiento</span>
            <span className="text-ink-500">
              {isDeposit
                ? 'Se crea un gasto en la categoría “Ahorro”, para que tu saldo disponible refleje el dinero apartado.'
                : 'Se crea un ingreso en “Otros ingresos”, porque el dinero vuelve a tu saldo disponible.'}
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
