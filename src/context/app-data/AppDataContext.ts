import { createContext } from 'react';
import type {
  AppData,
  BudgetInput,
  Category,
  CategoryInput,
  GoalInput,
  ISODate,
  MonthKey,
  SavingsGoal,
  Settings,
  Transaction,
  TransactionInput,
} from '@/types/finance';

export interface ContributionParams {
  goalId: string;
  amount: number;
  mode: 'deposit' | 'withdraw';
  date: ISODate;
  /** Registrar además el movimiento (gasto "Ahorro" o ingreso por retiro). */
  registerTransaction: boolean;
}

export interface AppDataActions {
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => Transaction | undefined;
  restoreTransaction: (transaction: Transaction) => void;
  saveBudget: (input: BudgetInput, id?: string) => void;
  deleteBudget: (id: string) => void;
  copyBudgets: (from: MonthKey, to: MonthKey) => number;
  addGoal: (input: GoalInput) => SavingsGoal;
  updateGoal: (id: string, input: GoalInput) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (params: ContributionParams) => void;
  addCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, input: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  updateSettings: (changes: Partial<Settings>) => void;
  loadDemoData: (settings?: Partial<Settings>) => void;
  startCleanAccount: (settings?: Partial<Settings>) => void;
  importData: (data: AppData) => void;
}

export interface AppDataContextValue {
  data: AppData;
  actions: AppDataActions;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);
