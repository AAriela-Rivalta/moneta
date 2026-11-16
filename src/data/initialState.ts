import { DATA_VERSION } from '@/config/constants';
import type { AppData, Settings } from '@/types/finance';
import { cloneDefaultCategories } from './defaultCategories';

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  currency: 'ARS',
  onboarded: false,
  isDemo: false,
};

/** Cuenta limpia: sin movimientos, presupuestos ni objetivos. */
export function createEmptyData(settings: Partial<Settings> = {}): AppData {
  return {
    version: DATA_VERSION,
    transactions: [],
    categories: cloneDefaultCategories(),
    budgets: [],
    goals: [],
    settings: { ...DEFAULT_SETTINGS, ...settings, isDemo: false },
  };
}
