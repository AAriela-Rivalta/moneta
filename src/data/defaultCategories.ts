import type { Category } from '@/types/finance';

export const DEFAULT_CATEGORIES: readonly Category[] = [
  // Gastos
  { id: 'exp-vivienda', name: 'Vivienda', type: 'expense', color: '#2a78d6', icon: 'home' },
  { id: 'exp-supermercado', name: 'Supermercado', type: 'expense', color: '#eb6834', icon: 'cart' },
  { id: 'exp-transporte', name: 'Transporte', type: 'expense', color: '#1baf7a', icon: 'car' },
  { id: 'exp-servicios', name: 'Servicios', type: 'expense', color: '#eda100', icon: 'zap' },
  { id: 'exp-salud', name: 'Salud y bienestar', type: 'expense', color: '#e87ba4', icon: 'health' },
  { id: 'exp-ocio', name: 'Ocio y salidas', type: 'expense', color: '#008300', icon: 'popcorn' },
  { id: 'exp-restaurantes', name: 'Restaurantes', type: 'expense', color: '#6250d6', icon: 'utensils' },
  { id: 'exp-educacion', name: 'Educación', type: 'expense', color: '#e34948', icon: 'education' },
  { id: 'exp-suscripciones', name: 'Suscripciones', type: 'expense', color: '#0e7490', icon: 'tv' },
  { id: 'exp-ropa', name: 'Ropa y cuidado personal', type: 'expense', color: '#9a6b3f', icon: 'shirt' },
  { id: 'exp-ahorro', name: 'Ahorro', type: 'expense', color: '#475569', icon: 'piggy', system: true },
  { id: 'exp-otros', name: 'Otros gastos', type: 'expense', color: '#a3a9b1', icon: 'more', system: true },
  // Ingresos
  { id: 'inc-sueldo', name: 'Sueldo', type: 'income', color: '#2a78d6', icon: 'briefcase' },
  { id: 'inc-freelance', name: 'Trabajos freelance', type: 'income', color: '#1baf7a', icon: 'laptop' },
  { id: 'inc-inversiones', name: 'Inversiones', type: 'income', color: '#008300', icon: 'trending' },
  { id: 'inc-ventas', name: 'Ventas', type: 'income', color: '#6250d6', icon: 'store' },
  { id: 'inc-regalos', name: 'Regalos', type: 'income', color: '#e87ba4', icon: 'gift' },
  { id: 'inc-otros', name: 'Otros ingresos', type: 'income', color: '#a3a9b1', icon: 'more', system: true },
];

export function cloneDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}
