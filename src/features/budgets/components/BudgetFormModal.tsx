import { Lightbulb } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { getSpentByCategory, suggestBudgetLimit } from '@/domain/budgets';
import { hasErrors, parseAmount, validateBudget, type BudgetFormValues, type FormErrors } from '@/domain/validation';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { getMonthLabel } from '@/lib/dates';
import type { Budget, MonthKey } from '@/types/finance';

interface BudgetFormModalProps {
  monthKey: MonthKey;
  budget?: Budget;
  initialCategoryId?: string;
  onClose: () => void;
}

export function BudgetFormModal({ monthKey, budget, initialCategoryId, onClose }: BudgetFormModalProps) {
  const { data, actions } = useAppData();
  const { categoryMap, expenseCategories } = useCategories();
  const { format } = useCurrency();
  const toast = useToast();

  const [values, setValues] = useState<BudgetFormValues>({
    categoryId: budget?.categoryId ?? initialCategoryId ?? '',
    limit: budget ? String(budget.limit) : '',
  });
  const [errors, setErrors] = useState<FormErrors<BudgetFormValues>>({});
  const [submitted, setSubmitted] = useState(false);

  const validationContext = { budgets: data.budgets, categories: categoryMap, monthKey, editingId: budget?.id };

  const available = useMemo(() => {
    const taken = new Set(data.budgets.filter((item) => item.month === monthKey && item.id !== budget?.id).map((item) => item.categoryId));
    return expenseCategories.filter((category) => category.id !== SYSTEM_CATEGORY.savings && !taken.has(category.id));
  }, [data.budgets, expenseCategories, monthKey, budget?.id]);

  const spent = values.categoryId ? (getSpentByCategory(data.transactions, monthKey).get(values.categoryId) ?? 0) : 0;
  const suggestion = values.categoryId ? suggestBudgetLimit(data.transactions, values.categoryId, monthKey) : null;
  const parsedLimit = parseAmount(values.limit);

  const update = (changes: Partial<BudgetFormValues>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (submitted) setErrors(validateBudget(next, validationContext));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const validation = validateBudget(values, validationContext);
    setErrors(validation);
    if (hasErrors(validation)) return;

    actions.saveBudget({ categoryId: values.categoryId, month: monthKey, limit: parsedLimit }, budget?.id);
    const name = categoryMap.get(values.categoryId)?.name ?? '';
    toast.success(budget ? 'Presupuesto actualizado' : 'Presupuesto creado', `${name} · ${format(parsedLimit)} para ${getMonthLabel(monthKey).toLowerCase()}`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      description={`Límite de gasto para ${getMonthLabel(monthKey).toLowerCase()}.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="budget-form">
            {budget ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Categoría" htmlFor="budget-category" error={errors.categoryId} required>
          <SelectInput
            id="budget-category"
            value={values.categoryId}
            onChange={(event) => update({ categoryId: event.target.value })}
            invalid={Boolean(errors.categoryId)}
            disabled={Boolean(budget)}
          >
            <option value="" disabled>
              Elegí una categoría de gasto
            </option>
            {available.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field
          label="Límite mensual"
          htmlFor="budget-limit"
          error={errors.limit}
          required
          hint={Number.isFinite(parsedLimit) && parsedLimit > 0 ? `= ${format(parsedLimit)}` : undefined}
        >
          <TextInput
            id="budget-limit"
            inputMode="decimal"
            value={values.limit}
            onChange={(event) => update({ limit: event.target.value })}
            placeholder="0"
            invalid={Boolean(errors.limit)}
            autoFocus={Boolean(initialCategoryId || budget)}
            autoComplete="off"
          />
        </Field>

        {values.categoryId && (
          <div className="space-y-2 rounded-xl bg-cream-50 p-3 text-sm ring-1 ring-cream-200">
            <p className="flex justify-between gap-3 text-ink-600">
              <span>Gastado en {getMonthLabel(monthKey, 'long').toLowerCase()}</span>
              <span className="font-semibold text-ink-900 tabular-nums">{format(spent)}</span>
            </p>
            {suggestion !== null && (
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-ink-600">
                  <Lightbulb className="size-4 text-brand-600" aria-hidden />
                  Sugerido (promedio 3 meses): <span className="font-semibold text-ink-900">{format(suggestion)}</span>
                </p>
                <Button size="sm" variant="soft" onClick={() => update({ limit: String(suggestion) })}>
                  Usar
                </Button>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
