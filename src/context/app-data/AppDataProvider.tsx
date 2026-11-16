import { useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { STORAGE_KEY, SYSTEM_CATEGORY } from '@/config/constants';
import { useToast } from '@/context/toast/useToast';
import { createDemoData } from '@/data/demoData';
import { createEmptyData } from '@/data/initialState';
import { planBudgetCopy } from '@/domain/budgets';
import { createId } from '@/lib/id';
import { roundMoney } from '@/lib/math';
import { loadAppData, parseAppData, saveAppData, serializeAppData } from '@/lib/storage';
import type { AppData } from '@/types/finance';
import { AppDataContext, type AppDataActions, type AppDataContextValue } from './AppDataContext';
import { appDataReducer } from './appDataReducer';

/** Primer uso: se cargan datos de demostración y se muestra la bienvenida. */
function initializeData(): AppData {
  return loadAppData() ?? createDemoData(new Date(), { onboarded: false });
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(appDataReducer, undefined, initializeData);
  const { notify } = useToast();
  const dataRef = useRef(data);
  const lastSaved = useRef<string | null>(null);

  // Persistencia automática después de cada operación.
  useEffect(() => {
    dataRef.current = data;
    const serialized = serializeAppData(data);
    if (serialized === lastSaved.current) return;
    lastSaved.current = serialized;
    if (!saveAppData(data)) {
      notify({ tone: 'error', title: 'No se pudieron guardar los cambios', description: 'Revisá que el navegador permita el almacenamiento local.' });
    }
  }, [data, notify]);

  // Sincronización entre pestañas abiertas de la aplicación.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue || event.newValue === lastSaved.current) return;
      const next = parseAppData(event.newValue);
      if (next) {
        lastSaved.current = event.newValue;
        dispatch({ type: 'data/replace', data: next });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const actions = useMemo<AppDataActions>(
    () => ({
      addTransaction(input) {
        const transaction = { ...input, amount: roundMoney(input.amount), id: createId('tx'), createdAt: new Date().toISOString() };
        dispatch({ type: 'transaction/add', transaction });
        return transaction;
      },
      updateTransaction(id, input) {
        dispatch({ type: 'transaction/update', id, changes: { ...input, amount: roundMoney(input.amount) } });
      },
      deleteTransaction(id) {
        const transaction = dataRef.current.transactions.find((tx) => tx.id === id);
        dispatch({ type: 'transaction/delete', id });
        return transaction;
      },
      restoreTransaction(transaction) {
        dispatch({ type: 'transaction/restore', transaction });
      },
      saveBudget(input, id) {
        dispatch({ type: 'budget/save', budget: { ...input, limit: roundMoney(input.limit), id: id ?? createId('bud') } });
      },
      deleteBudget(id) {
        dispatch({ type: 'budget/delete', id });
      },
      copyBudgets(from, to) {
        const copies = planBudgetCopy(dataRef.current.budgets, from, to);
        if (copies.length > 0) dispatch({ type: 'budget/add-many', budgets: copies });
        return copies.length;
      },
      addGoal(input) {
        const goal = { ...input, id: createId('goal'), createdAt: new Date().toISOString() };
        dispatch({ type: 'goal/add', goal });
        return goal;
      },
      updateGoal(id, input) {
        const current = dataRef.current.goals.find((goal) => goal.id === id);
        if (current) dispatch({ type: 'goal/update', goal: { ...current, ...input } });
      },
      deleteGoal(id) {
        dispatch({ type: 'goal/delete', id });
      },
      contributeToGoal({ goalId, amount, mode, date, registerTransaction }) {
        const goal = dataRef.current.goals.find((item) => item.id === goalId);
        if (!goal) return;
        const value = roundMoney(amount);
        const isDeposit = mode === 'deposit';
        dispatch({
          type: 'goal/contribute',
          goalId,
          delta: isDeposit ? value : -value,
          transaction: registerTransaction
            ? {
                id: createId('tx'),
                description: `${isDeposit ? 'Aporte a' : 'Retiro de'} ${goal.name}`,
                amount: value,
                type: isDeposit ? 'expense' : 'income',
                categoryId: isDeposit ? SYSTEM_CATEGORY.savings : SYSTEM_CATEGORY.otherIncome,
                date,
                goalId,
                createdAt: new Date().toISOString(),
              }
            : undefined,
        });
      },
      addCategory(input) {
        const category = { ...input, name: input.name.trim(), id: createId('cat') };
        dispatch({ type: 'category/add', category });
        return category;
      },
      updateCategory(id, input) {
        const current = dataRef.current.categories.find((category) => category.id === id);
        if (current) dispatch({ type: 'category/update', category: { ...current, ...input, name: input.name.trim(), type: current.type } });
      },
      deleteCategory(id) {
        dispatch({ type: 'category/delete', id });
      },
      updateSettings(changes) {
        dispatch({ type: 'settings/update', changes });
      },
      loadDemoData(settings = {}) {
        const { userName, currency } = dataRef.current.settings;
        dispatch({ type: 'data/replace', data: createDemoData(new Date(), { userName, currency, ...settings, onboarded: true }) });
      },
      startCleanAccount(settings = {}) {
        const { userName, currency } = dataRef.current.settings;
        dispatch({ type: 'data/replace', data: createEmptyData({ userName, currency, ...settings, onboarded: true }) });
      },
      importData(next) {
        dispatch({ type: 'data/replace', data: { ...next, settings: { ...next.settings, onboarded: true } } });
      },
    }),
    [],
  );

  const value = useMemo<AppDataContextValue>(() => ({ data, actions }), [data, actions]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
