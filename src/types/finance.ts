import type { IconName } from '@/config/icons';

/** Fecha en formato ISO local: YYYY-MM-DD */
export type ISODate = string;
/** Mes en formato YYYY-MM */
export type MonthKey = string;

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: IconName;
  /** Las categorías del sistema no se pueden eliminar (se usan como respaldo). */
  system?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: ISODate;
  notes?: string;
  /** Si el movimiento se generó desde un aporte o retiro de un objetivo de ahorro. */
  goalId?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: MonthKey;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: ISODate;
  icon: IconName;
  color: string;
  createdAt: string;
}

export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'BRL' | 'CLP' | 'UYU' | 'MXN';

export interface Settings {
  userName: string;
  currency: CurrencyCode;
  /** El usuario ya pasó por la pantalla de bienvenida. */
  onboarded: boolean;
  /** Los datos actuales provienen de la demostración. */
  isDemo: boolean;
}

export interface AppData {
  version: number;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  settings: Settings;
}

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'goalId'>;
export type BudgetInput = Omit<Budget, 'id'>;
export type GoalInput = Omit<SavingsGoal, 'id' | 'createdAt'>;
export type CategoryInput = Omit<Category, 'id' | 'system'>;
