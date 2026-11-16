import { Calculator } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AppearancePicker } from '@/components/shared/AppearancePicker';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import type { IconName } from '@/config/icons';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { simulateMonthlyPlan } from '@/domain/goals';
import { hasErrors, parseAmount, validateGoal, type FormErrors, type GoalFormValues } from '@/domain/validation';
import { useCurrency } from '@/hooks/useCurrency';
import { addMonths, isValidISODate, todayISO } from '@/lib/dates';
import type { SavingsGoal } from '@/types/finance';

export interface GoalTemplate {
  name: string;
  icon: IconName;
  color: string;
}

interface GoalFormModalProps {
  goal?: SavingsGoal;
  template?: GoalTemplate;
  onClose: () => void;
}

const GOAL_ICONS: IconName[] = ['target', 'piggy', 'shield', 'palmtree', 'plane', 'car', 'home', 'laptop', 'phone', 'education', 'gift', 'baby', 'paw', 'dumbbell', 'music', 'game', 'umbrella', 'wallet', 'landmark', 'trending'];

export function GoalFormModal({ goal, template, onClose }: GoalFormModalProps) {
  const { actions } = useAppData();
  const { format } = useCurrency();
  const toast = useToast();
  const today = todayISO();

  const [values, setValues] = useState<GoalFormValues>({
    name: goal?.name ?? template?.name ?? '',
    targetAmount: goal ? String(goal.targetAmount) : '',
    savedAmount: goal ? String(goal.savedAmount) : '',
    deadline: goal?.deadline ?? addMonths(today, 12),
  });
  const [icon, setIcon] = useState<IconName>(goal?.icon ?? template?.icon ?? 'target');
  const [color, setColor] = useState(goal?.color ?? template?.color ?? '#2a78d6');
  const [errors, setErrors] = useState<FormErrors<GoalFormValues>>({});
  const [submitted, setSubmitted] = useState(false);

  const target = parseAmount(values.targetAmount);
  const saved = values.savedAmount.trim() ? parseAmount(values.savedAmount) : 0;
  const preview =
    Number.isFinite(target) && target > 0 && Number.isFinite(saved) && isValidISODate(values.deadline) && values.deadline > today
      ? simulateMonthlyPlan(target, saved, values.deadline, today)
      : null;

  const update = (changes: Partial<GoalFormValues>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (submitted) setErrors(validateGoal(next, today, Boolean(goal)));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const validation = validateGoal(values, today, Boolean(goal));
    setErrors(validation);
    if (hasErrors(validation)) return;

    const input = { name: values.name.trim(), targetAmount: target, savedAmount: saved, deadline: values.deadline, icon, color };
    if (goal) {
      actions.updateGoal(goal.id, input);
      toast.success('Objetivo actualizado', input.name);
    } else {
      actions.addGoal(input);
      toast.success('Objetivo creado', `${input.name} · meta de ${format(target)}`);
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={goal ? 'Editar objetivo' : 'Nuevo objetivo de ahorro'}
      description="Definí cuánto querés reunir y para cuándo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="goal-form">
            {goal ? 'Guardar cambios' : 'Crear objetivo'}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Nombre" htmlFor="goal-name" error={errors.name} required>
          <TextInput
            id="goal-name"
            value={values.name}
            onChange={(event) => update({ name: event.target.value })}
            placeholder="Ej.: Vacaciones, auto, fondo de emergencia"
            invalid={Boolean(errors.name)}
            maxLength={50}
            autoFocus
            autoComplete="off"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monto objetivo" htmlFor="goal-target" error={errors.targetAmount} required>
            <TextInput id="goal-target" inputMode="decimal" value={values.targetAmount} onChange={(event) => update({ targetAmount: event.target.value })} placeholder="0" invalid={Boolean(errors.targetAmount)} autoComplete="off" />
          </Field>
          <Field label="Ya ahorrado" htmlFor="goal-saved" error={errors.savedAmount} hint="Opcional">
            <TextInput id="goal-saved" inputMode="decimal" value={values.savedAmount} onChange={(event) => update({ savedAmount: event.target.value })} placeholder="0" invalid={Boolean(errors.savedAmount)} autoComplete="off" />
          </Field>
          <Field label="Fecha límite" htmlFor="goal-deadline" error={errors.deadline} required>
            <TextInput id="goal-deadline" type="date" min={goal ? undefined : today} value={values.deadline} onChange={(event) => update({ deadline: event.target.value })} invalid={Boolean(errors.deadline)} />
          </Field>
        </div>

        {preview && (
          <p className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
            <Calculator className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            <span>
              {preview.remaining === 0 ? (
                'Ya alcanzaste este monto.'
              ) : (
                <>
                  Necesitás ahorrar <strong>{format(preview.monthly)}</strong> por mes durante {preview.monthsLeft} {preview.monthsLeft === 1 ? 'mes' : 'meses'} (≈ {format(preview.weekly)} por semana).
                </>
              )}
            </span>
          </p>
        )}

        <AppearancePicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} icons={GOAL_ICONS} />
      </form>
    </Modal>
  );
}
