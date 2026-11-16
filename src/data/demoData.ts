import { DATA_VERSION, SYSTEM_CATEGORY } from '@/config/constants';
import { addMonths, daysInMonth, getMonthBounds, getMonthKey, monthRange, pad, shiftMonth, toISODate } from '@/lib/dates';
import { sumBy } from '@/lib/math';
import type { AppData, Budget, MonthKey, SavingsGoal, Settings, Transaction, TransactionType } from '@/types/finance';
import { cloneDefaultCategories } from './defaultCategories';
import { DEFAULT_SETTINGS } from './initialState';

/** Generador pseudoaleatorio determinístico (mulberry32): la demo es siempre igual. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const DEMO_MONTHS = 6;

const OUTINGS = ['Entradas de cine', 'Recital', 'Salida de fin de semana', 'Libro', 'Teatro', 'Museo y café', 'Escapada de un día'] as const;

const GOAL_IDS = {
  emergency: 'demo-goal-emergencia',
  vacation: 'demo-goal-vacaciones',
  notebook: 'demo-goal-notebook',
} as const;

/**
 * Crea un conjunto de datos de demostración relativo a la fecha actual:
 * 6 meses de movimientos realistas, presupuestos y objetivos de ahorro.
 * Nunca genera movimientos con fecha futura.
 */
export function createDemoData(today: Date = new Date(), settings: Partial<Settings> = {}): AppData {
  const random = createRandom(20_261_116);
  const between = (min: number, max: number, step = 100) => Math.round((min + random() * (max - min)) / step) * step;
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];

  const todayIso = toISODate(today);
  const currentKey = getMonthKey(today);
  const months = monthRange(currentKey, DEMO_MONTHS);
  const transactions: Transaction[] = [];
  let sequence = 0;

  const add = (
    monthKey: MonthKey,
    day: number,
    description: string,
    amount: number,
    type: TransactionType,
    categoryId: string,
    extra: { notes?: string; goalId?: string } = {},
  ) => {
    const date = `${monthKey}-${pad(Math.min(day, daysInMonth(monthKey)))}`;
    if (date > todayIso) return;
    sequence += 1;
    transactions.push({
      id: `demo-tx-${sequence}`,
      description,
      amount,
      type,
      categoryId,
      date,
      createdAt: `${date}T12:00:00.000Z`,
      ...(extra.notes ? { notes: extra.notes } : {}),
      ...(extra.goalId ? { goalId: extra.goalId } : {}),
    });
  };

  months.forEach((key, index) => {
    const isCurrent = key === currentKey;
    const afterRaise = index >= 3;

    // Saldo de apertura: último día del mes previo al período de la demo.
    if (index === 0) {
      const openingMonth = shiftMonth(key, -1);
      add(openingMonth, daysInMonth(openingMonth), 'Saldo inicial de la cuenta', 850_000, 'income', SYSTEM_CATEGORY.otherIncome, {
        notes: 'Dinero disponible al comenzar a usar Moneta.',
      });
    }

    // Ingresos
    add(key, 1, 'Sueldo mensual', afterRaise ? 1_520_000 : 1_380_000, 'income', 'inc-sueldo', {
      notes: index === 3 ? 'Incluye el aumento acordado en paritarias.' : undefined,
    });
    if (index % 2 === 1) add(key, 18, 'Proyecto freelance de diseño web', between(180_000, 320_000, 5_000), 'income', 'inc-freelance');
    if (index % 3 === 0) add(key, 25, 'Rendimiento de plazo fijo', between(40_000, 65_000, 500), 'income', 'inc-inversiones');
    if (index === 2) add(key, 22, 'Venta de bicicleta usada', 210_000, 'income', 'inc-ventas');

    // Gastos fijos (se repiten todos los meses: el asistente los detecta como recurrentes)
    add(key, 5, 'Alquiler del departamento', afterRaise ? 465_000 : 430_000, 'expense', 'exp-vivienda');
    add(key, 10, 'Expensas', between(82_000, 92_000, 500), 'expense', 'exp-vivienda');
    add(key, 8, 'Prepaga médica', afterRaise ? 106_000 : 98_000, 'expense', 'exp-salud');
    add(key, 6, 'Cuota del gimnasio', 38_000, 'expense', 'exp-salud');
    add(key, 12, 'Internet y telefonía', 34_500, 'expense', 'exp-servicios');
    add(key, 14, 'Factura de luz', between(28_000, 38_000), 'expense', 'exp-servicios');
    add(key, 16, 'Factura de gas', between(14_000, 36_000), 'expense', 'exp-servicios');
    add(key, 3, 'Suscripción de streaming', 9_900, 'expense', 'exp-suscripciones');
    add(key, 3, 'Suscripción de música', 4_900, 'expense', 'exp-suscripciones');
    add(key, 9, 'Curso de inglés', 62_000, 'expense', 'exp-educacion');

    // Gastos variables
    const groceries = 4 + Math.floor(random() * 2);
    for (let i = 0; i < groceries; i += 1) {
      add(key, 2 + i * 6 + Math.floor(random() * 3), pick(['Compra en el supermercado', 'Compra semanal', 'Almacén y verdulería']), between(28_000, 66_000), 'expense', 'exp-supermercado');
    }
    add(key, 4, 'Carga de combustible', between(38_000, 50_000), 'expense', 'exp-transporte');
    add(key, 19, 'Carga de combustible', between(38_000, 50_000), 'expense', 'exp-transporte');
    add(key, 7, 'Recarga de transporte público', between(6_000, 12_000), 'expense', 'exp-transporte');
    add(key, 21, 'Recarga de transporte público', between(6_000, 12_000), 'expense', 'exp-transporte');

    const restaurantVisits = isCurrent ? 4 : 2 + Math.floor(random() * 2);
    for (let i = 0; i < restaurantVisits; i += 1) {
      add(
        key,
        3 + i * 6 + Math.floor(random() * 2),
        pick(['Cena con amigos', 'Almuerzo de trabajo', 'Pedido de comida a domicilio', 'Café y merienda']),
        isCurrent ? between(32_000, 52_000) : between(18_000, 36_000),
        'expense',
        'exp-restaurantes',
      );
    }

    // Salidas variadas: rotan para no generar falsos gastos recurrentes.
    const outings = 1 + Math.floor(random() * 2);
    for (let i = 0; i < outings; i += 1) {
      add(key, 11 + i * 9, OUTINGS[(index * 2 + i) % OUTINGS.length], between(15_000, 42_000), 'expense', 'exp-ocio');
    }

    if (index % 2 === 0) add(key, 15, pick(['Zapatillas', 'Ropa de temporada', 'Peluquería y cuidado personal']), between(35_000, 85_000), 'expense', 'exp-ropa');
    if (random() < 0.6) add(key, 13, 'Farmacia', between(8_000, 24_000), 'expense', 'exp-salud');
    if (index === 4) add(key, 20, 'Reparación del lavarropas', 95_000, 'expense', 'exp-otros', { notes: 'Cambio de bomba de agua.' });

    // Aportes a objetivos de ahorro
    add(key, 2, 'Aporte a Fondo de emergencia', 120_000, 'expense', SYSTEM_CATEGORY.savings, { goalId: GOAL_IDS.emergency });
    if (index % 2 === 0) add(key, 2, 'Aporte a Vacaciones en la costa', 80_000, 'expense', SYSTEM_CATEGORY.savings, { goalId: GOAL_IDS.vacation });
  });

  const contributed = (goalId: string) => sumBy(transactions.filter((tx) => tx.goalId === goalId), (tx) => tx.amount);
  const createdAt = `${getMonthBounds(months[0]).start}T12:00:00.000Z`;

  const goals: SavingsGoal[] = [
    {
      id: GOAL_IDS.emergency,
      name: 'Fondo de emergencia',
      targetAmount: 3_600_000,
      savedAmount: 1_050_000 + contributed(GOAL_IDS.emergency),
      deadline: getMonthBounds(shiftMonth(currentKey, 14)).end,
      icon: 'shield',
      color: '#2a78d6',
      createdAt,
    },
    {
      id: GOAL_IDS.vacation,
      name: 'Vacaciones en la costa',
      targetAmount: 1_500_000,
      savedAmount: 420_000 + contributed(GOAL_IDS.vacation),
      deadline: getMonthBounds(shiftMonth(currentKey, 3)).end,
      icon: 'palmtree',
      color: '#eb6834',
      createdAt,
    },
    {
      id: GOAL_IDS.notebook,
      name: 'Notebook para programar',
      targetAmount: 1_900_000,
      savedAmount: 1_350_000,
      deadline: addMonths(todayIso, 7),
      icon: 'laptop',
      color: '#6250d6',
      createdAt,
    },
  ];

  const budgetPlan: Array<[string, number]> = [
    ['exp-supermercado', 260_000],
    ['exp-restaurantes', 110_000],
    ['exp-ocio', 70_000],
    ['exp-transporte', 130_000],
    ['exp-servicios', 105_000],
    ['exp-ropa', 80_000],
    ['exp-suscripciones', 16_000],
  ];
  const budgets: Budget[] = [shiftMonth(currentKey, -1), currentKey].flatMap((month) =>
    budgetPlan.map(([categoryId, limit]) => ({ id: `demo-budget-${month}-${categoryId}`, categoryId, month, limit })),
  );

  return {
    version: DATA_VERSION,
    transactions,
    categories: cloneDefaultCategories(),
    budgets,
    goals,
    settings: { ...DEFAULT_SETTINGS, ...settings, isDemo: true },
  };
}
