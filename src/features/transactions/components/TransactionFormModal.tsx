import { ArrowDownCircle, ArrowUpCircle, Link2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import {
  hasErrors,
  parseAmount,
  validateTransaction,
  type FormErrors,
  type TransactionFormValues,
} from '@/domain/validation';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { todayISO } from '@/lib/dates';
import type { Transaction, TransactionInput, TransactionType } from '@/types/finance';

interface TransactionFormModalProps {
  transaction?: Transaction;
  initialType: TransactionType;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Gasto', icon: ArrowDownCircle, activeClassName: 'text-coral-600' },
  { value: 'income' as const, label: 'Ingreso', icon: ArrowUpCircle, activeClassName: 'text-brand-700' },
];

function initialValues(transaction: Transaction | undefined, type: TransactionType): TransactionFormValues {
  if (transaction) {
    return {
      type: transaction.type,
      description: transaction.description,
      amount: String(transaction.amount).replace('.', ','),
      categoryId: transaction.categoryId,
      date: transaction.date,
      notes: transaction.notes ?? '',
    };
  }
  return { type, description: '', amount: '', categoryId: '', date: todayISO(), notes: '' };
}

export function TransactionFormModal({ transaction, initialType, onClose }: TransactionFormModalProps) {
  const { data, actions } = useAppData();
  const { categoryMap, expenseCategories, incomeCategories } = useCategories();
  const { format } = useCurrency();
  const toast = useToast();

  const [values, setValues] = useState(() => initialValues(transaction, initialType));
  const [errors, setErrors] = useState<FormErrors<TransactionFormValues>>({});
  const [submitted, setSubmitted] = useState(false);
  const keepOpen = useRef(false);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(transaction);
  const linkedGoal = transaction?.goalId ? data.goals.find((goal) => goal.id === transaction.goalId) : undefined;
  const categories = values.type === 'income' ? incomeCategories : expenseCategories;
  const parsedAmount = parseAmount(values.amount);

  const update = (changes: Partial<TransactionFormValues>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (submitted) setErrors(validateTransaction(next, categoryMap, todayISO()));
  };

  const changeType = (type: TransactionType) => {
    update({ type, categoryId: categoryMap.get(values.categoryId)?.type === type ? values.categoryId : '' });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const validation = validateTransaction(values, categoryMap, todayISO());
    setErrors(validation);
    if (hasErrors(validation)) {
      keepOpen.current = false;
      return;
    }

    const input: TransactionInput = {
      type: values.type,
      description: values.description.trim(),
      amount: parsedAmount,
      categoryId: values.categoryId,
      date: values.date,
      notes: values.notes.trim() || undefined,
    };

    if (transaction) {
      actions.updateTransaction(transaction.id, input);
      toast.success('Movimiento actualizado', input.description);
      onClose();
      return;
    }

    actions.addTransaction(input);
    toast.success(input.type === 'income' ? 'Ingreso registrado' : 'Gasto registrado', `${input.description} · ${format(input.amount)}`);

    if (keepOpen.current) {
      keepOpen.current = false;
      setValues({ ...initialValues(undefined, values.type), date: values.date, categoryId: values.categoryId });
      setSubmitted(false);
      setErrors({});
      descriptionRef.current?.focus();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar movimiento' : values.type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto'}
      description={isEditing ? 'Los cambios se reflejan al instante en saldos y estadísticas.' : 'Completá los datos del movimiento.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {!isEditing && (
            <Button type="submit" form="transaction-form" variant="soft" onClick={() => (keepOpen.current = true)}>
              Guardar y cargar otro
            </Button>
          )}
          <Button type="submit" form="transaction-form" variant={values.type === 'income' ? 'primary' : 'coral'}>
            {isEditing ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {linkedGoal ? (
          <p className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
            <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            Vinculado al objetivo “{linkedGoal.name}”. Si cambiás el monto, se actualizará lo ahorrado.
          </p>
        ) : (
          <SegmentedControl options={TYPE_OPTIONS} value={values.type} onChange={changeType} ariaLabel="Tipo de movimiento" fullWidth />
        )}

        <Field label="Descripción" htmlFor="tx-description" error={errors.description} required>
          <TextInput
            ref={descriptionRef}
            id="tx-description"
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            placeholder={values.type === 'income' ? 'Ej.: Sueldo de noviembre' : 'Ej.: Compra en el supermercado'}
            invalid={Boolean(errors.description)}
            maxLength={80}
            autoFocus
            autoComplete="off"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monto"
            htmlFor="tx-amount"
            error={errors.amount}
            required
            hint={Number.isFinite(parsedAmount) && parsedAmount > 0 ? `= ${format(parsedAmount)}` : 'Podés usar coma para decimales.'}
          >
            <TextInput
              id="tx-amount"
              inputMode="decimal"
              value={values.amount}
              onChange={(event) => update({ amount: event.target.value })}
              placeholder="0"
              invalid={Boolean(errors.amount)}
              autoComplete="off"
            />
          </Field>
          <Field label="Fecha" htmlFor="tx-date" error={errors.date} required>
            <TextInput id="tx-date" type="date" value={values.date} onChange={(event) => update({ date: event.target.value })} invalid={Boolean(errors.date)} />
          </Field>
        </div>

        <Field
          label="Categoría"
          htmlFor="tx-category"
          error={errors.categoryId}
          required
          hint={
            <>
              ¿No encontrás la categoría?{' '}
              <Link to="/configuracion" className="font-semibold text-brand-700 hover:underline">
                Gestionar categorías
              </Link>
            </>
          }
        >
          <SelectInput id="tx-category" value={values.categoryId} onChange={(event) => update({ categoryId: event.target.value })} invalid={Boolean(errors.categoryId)}>
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Observaciones" htmlFor="tx-notes" error={errors.notes} hint={`Opcional · ${values.notes.length}/300`}>
          <TextArea
            id="tx-notes"
            value={values.notes}
            onChange={(event) => update({ notes: event.target.value })}
            placeholder="Detalles adicionales, número de factura, etc."
            invalid={Boolean(errors.notes)}
            maxLength={300}
            rows={2}
          />
        </Field>
      </form>
    </Modal>
  );
}
