import { MAX_AMOUNT } from '@/config/constants';
import { addDays, isValidISODate } from '@/lib/dates';
import type { Budget, Category, ISODate, MonthKey, SavingsGoal, TransactionType } from '@/types/finance';
import { normalizeText } from './transactions';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Interpreta montos escritos con formato local o internacional:
 * "15000", "15.000", "15.000,50", "15000.5", "15,5". Devuelve NaN si no es válido.
 */
export function parseAmount(raw: string): number {
  let value = raw.trim().replace(/[\s$]/g, '');
  if (value === '') return Number.NaN;
  const negative = value.startsWith('-');
  value = value.replace(/^[-+]/, '');
  if (!/^[\d.,]+$/.test(value)) return Number.NaN;

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  let normalized = value;

  if (lastComma > -1 && lastDot > -1) {
    const decimal = lastComma > lastDot ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    normalized = value.split(thousands).join('').replace(decimal, '.');
  } else if (lastComma > -1) {
    const commas = value.split(',').length - 1;
    normalized = commas > 1 ? value.replace(/,/g, '') : value.replace(',', '.');
  } else if (lastDot > -1) {
    const dots = value.split('.').length - 1;
    normalized = dots > 1 || /^\d{1,3}\.\d{3}$/.test(value) ? value.replace(/\./g, '') : value;
  }

  if ((normalized.match(/\./g) ?? []).length > 1 || normalized === '.') return Number.NaN;
  const amount = Number(normalized);
  return negative ? -amount : amount;
}

export function validateAmountField(raw: string, options: { allowZero?: boolean; label?: string } = {}): string | undefined {
  const { allowZero = false, label = 'un monto' } = options;
  if (!raw.trim()) return `Ingresá ${label}.`;
  const amount = parseAmount(raw);
  if (Number.isNaN(amount)) return 'Ingresá un número válido (ej.: 15000 o 15.000,50).';
  if (amount < 0) return 'El monto no puede ser negativo.';
  if (amount === 0 && !allowZero) return 'El monto debe ser mayor a cero.';
  if (amount > MAX_AMOUNT) return 'El monto es demasiado grande.';
  return undefined;
}

/* ------------------------------------------------------------------ */

export interface TransactionFormValues {
  type: TransactionType;
  description: string;
  amount: string;
  categoryId: string;
  date: string;
  notes: string;
}

export function validateTransaction(
  values: TransactionFormValues,
  categories: ReadonlyMap<string, Category>,
  today: ISODate,
): FormErrors<TransactionFormValues> {
  const errors: FormErrors<TransactionFormValues> = {};
  const description = values.description.trim();

  if (!description) errors.description = 'Ingresá una descripción.';
  else if (description.length < 2) errors.description = 'La descripción es demasiado corta.';
  else if (description.length > 80) errors.description = 'Usá como máximo 80 caracteres.';

  errors.amount = validateAmountField(values.amount);

  const category = categories.get(values.categoryId);
  if (!category) errors.categoryId = 'Elegí una categoría.';
  else if (category.type !== values.type) errors.categoryId = 'La categoría no corresponde al tipo de movimiento.';

  if (!values.date) errors.date = 'Elegí una fecha.';
  else if (!isValidISODate(values.date)) errors.date = 'La fecha no es válida.';
  else if (values.date < '2000-01-01') errors.date = 'La fecha es demasiado antigua.';
  else if (values.date > addDays(today, 366)) errors.date = 'La fecha no puede superar un año a futuro.';

  if (values.notes.length > 300) errors.notes = 'Usá como máximo 300 caracteres.';
  return errors;
}

/* ------------------------------------------------------------------ */

export interface BudgetFormValues {
  categoryId: string;
  limit: string;
}

export function validateBudget(
  values: BudgetFormValues,
  context: { budgets: readonly Budget[]; categories: ReadonlyMap<string, Category>; monthKey: MonthKey; editingId?: string },
): FormErrors<BudgetFormValues> {
  const errors: FormErrors<BudgetFormValues> = {};
  const category = context.categories.get(values.categoryId);

  if (!category) errors.categoryId = 'Elegí una categoría.';
  else if (category.type !== 'expense') errors.categoryId = 'Solo se pueden presupuestar categorías de gasto.';
  else if (
    context.budgets.some(
      (budget) => budget.month === context.monthKey && budget.categoryId === values.categoryId && budget.id !== context.editingId,
    )
  ) {
    errors.categoryId = 'Ya existe un presupuesto para esta categoría en el mes.';
  }

  errors.limit = validateAmountField(values.limit, { label: 'el límite' });
  return errors;
}

/* ------------------------------------------------------------------ */

export interface GoalFormValues {
  name: string;
  targetAmount: string;
  savedAmount: string;
  deadline: string;
}

export function validateGoal(values: GoalFormValues, today: ISODate, isEditing: boolean): FormErrors<GoalFormValues> {
  const errors: FormErrors<GoalFormValues> = {};
  const name = values.name.trim();

  if (!name) errors.name = 'Ingresá un nombre para el objetivo.';
  else if (name.length < 2) errors.name = 'El nombre es demasiado corto.';
  else if (name.length > 50) errors.name = 'Usá como máximo 50 caracteres.';

  errors.targetAmount = validateAmountField(values.targetAmount, { label: 'el monto objetivo' });
  errors.savedAmount = validateAmountField(values.savedAmount || '0', { allowZero: true });

  if (!values.deadline) errors.deadline = 'Elegí una fecha límite.';
  else if (!isValidISODate(values.deadline)) errors.deadline = 'La fecha no es válida.';
  else if (!isEditing && values.deadline <= today) errors.deadline = 'La fecha límite debe ser posterior a hoy.';
  else if (values.deadline > addDays(today, 365 * 50)) errors.deadline = 'La fecha límite es demasiado lejana.';

  return errors;
}

export interface ContributionFormValues {
  amount: string;
}

export function validateContribution(
  values: ContributionFormValues,
  mode: 'deposit' | 'withdraw',
  goal: SavingsGoal,
): FormErrors<ContributionFormValues> {
  const error = validateAmountField(values.amount);
  if (error) return { amount: error };
  if (mode === 'withdraw' && parseAmount(values.amount) > goal.savedAmount) {
    return { amount: 'No podés retirar más de lo que ahorraste en este objetivo.' };
  }
  return {};
}

/* ------------------------------------------------------------------ */

export interface CategoryFormValues {
  name: string;
  type: TransactionType;
}

export function validateCategory(
  values: CategoryFormValues,
  categories: readonly Category[],
  editingId?: string,
): FormErrors<CategoryFormValues> {
  const errors: FormErrors<CategoryFormValues> = {};
  const name = values.name.trim();

  if (!name) errors.name = 'Ingresá un nombre.';
  else if (name.length < 2) errors.name = 'El nombre es demasiado corto.';
  else if (name.length > 40) errors.name = 'Usá como máximo 40 caracteres.';
  else if (
    categories.some(
      (category) => category.id !== editingId && category.type === values.type && normalizeText(category.name) === normalizeText(name),
    )
  ) {
    errors.name = 'Ya existe una categoría con ese nombre.';
  }
  return errors;
}
