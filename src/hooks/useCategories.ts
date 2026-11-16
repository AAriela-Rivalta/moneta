import { useMemo } from 'react';
import { useAppData } from '@/context/app-data/useAppData';
import type { Category } from '@/types/finance';

const byName = (a: Category, b: Category) => {
  // Las categorías de respaldo ("Otros") van al final.
  if (a.system !== b.system) return a.system ? 1 : -1;
  return a.name.localeCompare(b.name, 'es');
};

export function useCategories() {
  const { data } = useAppData();
  const { categories } = data;

  return useMemo(() => {
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    return {
      categories,
      categoryMap: categoryMap as ReadonlyMap<string, Category>,
      expenseCategories: categories.filter((category) => category.type === 'expense').sort(byName),
      incomeCategories: categories.filter((category) => category.type === 'income').sort(byName),
    };
  }, [categories]);
}
