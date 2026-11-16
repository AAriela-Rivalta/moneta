import { SYSTEM_CATEGORY } from '@/config/constants';
import { roundMoney } from '@/lib/math';
import type { AppData, Budget, Category, SavingsGoal, Settings, Transaction, TransactionInput } from '@/types/finance';

export type AppDataAction =
  | { type: 'transaction/add'; transaction: Transaction }
  | { type: 'transaction/restore'; transaction: Transaction }
  | { type: 'transaction/update'; id: string; changes: TransactionInput }
  | { type: 'transaction/delete'; id: string }
  | { type: 'budget/save'; budget: Budget }
  | { type: 'budget/add-many'; budgets: Budget[] }
  | { type: 'budget/delete'; id: string }
  | { type: 'goal/add'; goal: SavingsGoal }
  | { type: 'goal/update'; goal: SavingsGoal }
  | { type: 'goal/delete'; id: string }
  | { type: 'goal/contribute'; goalId: string; delta: number; transaction?: Transaction }
  | { type: 'category/add'; category: Category }
  | { type: 'category/update'; category: Category }
  | { type: 'category/delete'; id: string }
  | { type: 'settings/update'; changes: Partial<Settings> }
  | { type: 'data/replace'; data: AppData };

/** Efecto de un movimiento vinculado sobre el monto ahorrado de un objetivo. */
function goalEffect(tx: Transaction | undefined, goalId: string): number {
  if (!tx || tx.goalId !== goalId) return 0;
  return tx.type === 'expense' ? tx.amount : -tx.amount;
}

/**
 * Mantiene sincronizado el monto ahorrado de un objetivo cuando se edita o elimina
 * un movimiento que se generó desde un aporte o retiro.
 */
function syncGoals(goals: SavingsGoal[], before?: Transaction, after?: Transaction): SavingsGoal[] {
  const ids = new Set([before?.goalId, after?.goalId].filter(Boolean));
  if (ids.size === 0) return goals;
  return goals.map((goal) =>
    ids.has(goal.id)
      ? { ...goal, savedAmount: Math.max(0, roundMoney(goal.savedAmount - goalEffect(before, goal.id) + goalEffect(after, goal.id))) }
      : goal,
  );
}

const replaceById = <T extends { id: string }>(items: T[], next: T) => items.map((item) => (item.id === next.id ? next : item));

export function appDataReducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'transaction/add':
      return { ...state, transactions: [...state.transactions, action.transaction] };

    case 'transaction/restore':
      if (state.transactions.some((tx) => tx.id === action.transaction.id)) return state;
      return {
        ...state,
        transactions: [...state.transactions, action.transaction],
        goals: syncGoals(state.goals, undefined, action.transaction),
      };

    case 'transaction/update': {
      const current = state.transactions.find((tx) => tx.id === action.id);
      if (!current) return state;
      const updated: Transaction = { ...current, ...action.changes };
      if (!updated.notes) delete updated.notes;
      return {
        ...state,
        transactions: replaceById(state.transactions, updated),
        goals: syncGoals(state.goals, current, updated),
      };
    }

    case 'transaction/delete': {
      const current = state.transactions.find((tx) => tx.id === action.id);
      if (!current) return state;
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx.id !== action.id),
        goals: syncGoals(state.goals, current, undefined),
      };
    }

    case 'budget/save': {
      const exists = state.budgets.some((budget) => budget.id === action.budget.id);
      return { ...state, budgets: exists ? replaceById(state.budgets, action.budget) : [...state.budgets, action.budget] };
    }

    case 'budget/add-many': {
      const taken = new Set(state.budgets.map((budget) => `${budget.month}|${budget.categoryId}`));
      const fresh = action.budgets.filter((budget) => !taken.has(`${budget.month}|${budget.categoryId}`));
      return fresh.length === 0 ? state : { ...state, budgets: [...state.budgets, ...fresh] };
    }

    case 'budget/delete':
      return { ...state, budgets: state.budgets.filter((budget) => budget.id !== action.id) };

    case 'goal/add':
      return { ...state, goals: [...state.goals, action.goal] };

    case 'goal/update':
      return { ...state, goals: replaceById(state.goals, action.goal) };

    case 'goal/delete':
      // Los movimientos generados se conservan (el dinero sí se movió), pero se desvinculan.
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.id),
        transactions: state.transactions.map((tx) => {
          if (tx.goalId !== action.id) return tx;
          const unlinked = { ...tx };
          delete unlinked.goalId;
          return unlinked;
        }),
      };

    case 'goal/contribute':
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.goalId ? { ...goal, savedAmount: Math.max(0, roundMoney(goal.savedAmount + action.delta)) } : goal,
        ),
        transactions: action.transaction ? [...state.transactions, action.transaction] : state.transactions,
      };

    case 'category/add':
      return { ...state, categories: [...state.categories, action.category] };

    case 'category/update':
      return { ...state, categories: replaceById(state.categories, action.category) };

    case 'category/delete': {
      const category = state.categories.find((item) => item.id === action.id);
      if (!category || category.system) return state;
      const fallback = category.type === 'income' ? SYSTEM_CATEGORY.otherIncome : SYSTEM_CATEGORY.otherExpense;
      return {
        ...state,
        categories: state.categories.filter((item) => item.id !== action.id),
        transactions: state.transactions.map((tx) => (tx.categoryId === action.id ? { ...tx, categoryId: fallback } : tx)),
        budgets: state.budgets.filter((budget) => budget.categoryId !== action.id),
      };
    }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.changes } };

    case 'data/replace':
      return action.data;

    default:
      return state;
  }
}
