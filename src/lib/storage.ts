import { DATA_VERSION, MAX_AMOUNT, STORAGE_KEY, isCurrencyCode } from '@/config/constants';
import { isIconName } from '@/config/icons';
import { DEFAULT_CATEGORIES } from '@/data/defaultCategories';
import { DEFAULT_SETTINGS } from '@/data/initialState';
import { isValidISODate, isValidMonthKey } from '@/lib/dates';
import type { AppData, Budget, Category, SavingsGoal, Settings, Transaction, TransactionType } from '@/types/finance';

/* ------------------------------------------------------------------ */
/* Acceso de bajo nivel a localStorage (tolerante a errores)           */
/* ------------------------------------------------------------------ */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('[Moneta] No se pudo guardar en localStorage', error);
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Sin acceso al almacenamiento: no hay nada que borrar.
  }
}

/* ------------------------------------------------------------------ */
/* Validación y saneamiento de datos persistidos o importados          */
/* ------------------------------------------------------------------ */

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT;
const isType = (value: unknown): value is TransactionType => value === 'income' || value === 'expense';
const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

function sanitizeCategory(value: unknown): Category | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name) || !isType(value.type)) return null;
  return {
    id: value.id,
    name: value.name.trim(),
    type: value.type,
    color: isHexColor(value.color) ? value.color : '#a3a9b1',
    icon: isIconName(value.icon) ? value.icon : 'more',
    ...(value.system === true ? { system: true } : {}),
  };
}

function sanitizeTransaction(value: unknown, categories: Map<string, Category>): Transaction | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.description)) return null;
  if (!isAmount(value.amount) || !isType(value.type) || typeof value.date !== 'string' || !isValidISODate(value.date)) return null;

  const category = typeof value.categoryId === 'string' ? categories.get(value.categoryId) : undefined;
  const fallback = value.type === 'income' ? 'inc-otros' : 'exp-otros';

  return {
    id: value.id,
    description: value.description.trim(),
    amount: value.amount,
    type: value.type,
    categoryId: category && category.type === value.type ? category.id : fallback,
    date: value.date,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : `${value.date}T12:00:00.000Z`,
    ...(isNonEmptyString(value.notes) ? { notes: value.notes.trim() } : {}),
    ...(isNonEmptyString(value.goalId) ? { goalId: value.goalId } : {}),
  };
}

function sanitizeBudget(value: unknown, categories: Map<string, Category>): Budget | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || typeof value.categoryId !== 'string') return null;
  if (typeof value.month !== 'string' || !isValidMonthKey(value.month) || !isAmount(value.limit)) return null;
  if (categories.get(value.categoryId)?.type !== 'expense') return null;
  return { id: value.id, categoryId: value.categoryId, month: value.month, limit: value.limit };
}

function sanitizeGoal(value: unknown): SavingsGoal | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name)) return null;
  if (!isAmount(value.targetAmount) || typeof value.deadline !== 'string' || !isValidISODate(value.deadline)) return null;
  const saved = typeof value.savedAmount === 'number' && Number.isFinite(value.savedAmount) ? Math.max(0, value.savedAmount) : 0;
  return {
    id: value.id,
    name: value.name.trim(),
    targetAmount: value.targetAmount,
    savedAmount: saved,
    deadline: value.deadline,
    icon: isIconName(value.icon) ? value.icon : 'target',
    color: isHexColor(value.color) ? value.color : '#2a78d6',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  };
}

function sanitizeSettings(value: unknown): Settings {
  const source = isRecord(value) ? value : {};
  return {
    userName: typeof source.userName === 'string' ? source.userName.slice(0, 40) : DEFAULT_SETTINGS.userName,
    currency: isCurrencyCode(source.currency) ? source.currency : DEFAULT_SETTINGS.currency,
    onboarded: typeof source.onboarded === 'boolean' ? source.onboarded : true,
    isDemo: source.isDemo === true,
  };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

const notNull = <T,>(value: T | null): value is T => value !== null;

/**
 * Valida una estructura desconocida (localStorage o archivo importado) y devuelve
 * datos seguros para la app, descartando registros corruptos. `null` si no es válida.
 */
export function sanitizeAppData(input: unknown): AppData | null {
  if (!isRecord(input)) return null;
  const { transactions, categories, budgets, goals } = input;
  if (!Array.isArray(transactions) || !Array.isArray(categories) || !Array.isArray(budgets) || !Array.isArray(goals)) return null;

  const cleanCategories = uniqueById(categories.map(sanitizeCategory).filter(notNull));
  // Las categorías del sistema siempre deben existir: son el respaldo al eliminar otras.
  for (const systemCategory of DEFAULT_CATEGORIES.filter((category) => category.system)) {
    const existing = cleanCategories.find((category) => category.id === systemCategory.id);
    if (existing) existing.system = true;
    else cleanCategories.push({ ...systemCategory });
  }
  const categoryMap = new Map(cleanCategories.map((category) => [category.id, category]));

  const cleanBudgets = uniqueById(budgets.map((budget) => sanitizeBudget(budget, categoryMap)).filter(notNull));
  // Un único presupuesto por categoría y mes.
  const budgetKeys = new Set<string>();
  const dedupedBudgets = cleanBudgets.filter((budget) => {
    const key = `${budget.month}|${budget.categoryId}`;
    return budgetKeys.has(key) ? false : (budgetKeys.add(key), true);
  });

  return {
    version: DATA_VERSION,
    categories: cleanCategories,
    transactions: uniqueById(transactions.map((tx) => sanitizeTransaction(tx, categoryMap)).filter(notNull)),
    budgets: dedupedBudgets,
    goals: uniqueById(goals.map(sanitizeGoal).filter(notNull)),
    settings: sanitizeSettings(input.settings),
  };
}

/* ------------------------------------------------------------------ */
/* API de persistencia de la aplicación                                */
/* ------------------------------------------------------------------ */

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data);
}

export function parseAppData(raw: string): AppData | null {
  try {
    return sanitizeAppData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadAppData(): AppData | null {
  const raw = readStorage(STORAGE_KEY);
  return raw ? parseAppData(raw) : null;
}

export function saveAppData(data: AppData): boolean {
  return writeStorage(STORAGE_KEY, serializeAppData(data));
}
