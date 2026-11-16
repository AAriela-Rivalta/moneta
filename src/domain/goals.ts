import { addMonths, diffInDays, getMonthKey, getMonthLabel, shiftMonth } from '@/lib/dates';
import { clamp, percentOf } from '@/lib/math';
import type { ISODate, SavingsGoal } from '@/types/finance';

const DAYS_PER_MONTH = 30.44;

export type GoalStatus = 'completed' | 'overdue' | 'active';

export interface GoalProgress {
  percentage: number;
  remaining: number;
  daysLeft: number;
  monthsLeft: number;
  monthlyNeeded: number;
  weeklyNeeded: number;
  status: GoalStatus;
}

/** Cantidad de aportes mensuales posibles antes de la fecha límite (mínimo 1). */
export function getMonthsLeft(today: ISODate, deadline: ISODate): number {
  const days = diffInDays(today, deadline);
  return Math.max(1, Math.ceil(days / DAYS_PER_MONTH));
}

export function getGoalProgress(goal: SavingsGoal, today: ISODate): GoalProgress {
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const daysLeft = diffInDays(today, goal.deadline);
  const monthsLeft = getMonthsLeft(today, goal.deadline);
  const status: GoalStatus = remaining === 0 ? 'completed' : daysLeft < 0 ? 'overdue' : 'active';
  const weeksLeft = Math.max(1, Math.ceil(Math.max(daysLeft, 0) / 7));

  return {
    percentage: clamp(percentOf(goal.savedAmount, goal.targetAmount), 0, 100),
    remaining,
    daysLeft,
    monthsLeft,
    // Redondeado hacia arriba para que la cuota alcance para llegar a la meta.
    monthlyNeeded: status === 'active' ? Math.ceil(remaining / monthsLeft) : 0,
    weeklyNeeded: status === 'active' ? Math.ceil(remaining / weeksLeft) : 0,
    status,
  };
}

export function describeTimeLeft(daysLeft: number): string {
  if (daysLeft < 0) return `Venció hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`;
  if (daysLeft === 0) return 'Vence hoy';
  if (daysLeft < 45) return `Faltan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;
  const months = Math.round(daysLeft / DAYS_PER_MONTH);
  return `Faltan ${months} meses`;
}

export interface GoalsSummary {
  totalTarget: number;
  totalSaved: number;
  percentage: number;
  completed: number;
  active: number;
}

export function getGoalsSummary(goals: readonly SavingsGoal[], today: ISODate): GoalsSummary {
  const totalTarget = goals.reduce((total, goal) => total + goal.targetAmount, 0);
  const totalSaved = goals.reduce((total, goal) => total + Math.min(goal.savedAmount, goal.targetAmount), 0);
  const statuses = goals.map((goal) => getGoalProgress(goal, today).status);
  return {
    totalTarget,
    totalSaved,
    percentage: percentOf(totalSaved, totalTarget),
    completed: statuses.filter((status) => status === 'completed').length,
    active: statuses.filter((status) => status === 'active').length,
  };
}

/* ------------------------------------------------------------------ */
/* Simulador de ahorro                                                  */
/* ------------------------------------------------------------------ */

export interface MonthlyPlan {
  remaining: number;
  monthsLeft: number;
  monthly: number;
  weekly: number;
  daily: number;
  isPastDeadline: boolean;
}

/** ¿Cuánto tengo que ahorrar por mes para llegar a la meta en la fecha límite? */
export function simulateMonthlyPlan(target: number, saved: number, deadline: ISODate, today: ISODate): MonthlyPlan {
  const remaining = Math.max(0, target - saved);
  const days = diffInDays(today, deadline);
  const monthsLeft = getMonthsLeft(today, deadline);
  const safeDays = Math.max(1, days);
  return {
    remaining,
    monthsLeft,
    monthly: Math.ceil(remaining / monthsLeft),
    weekly: Math.ceil(remaining / Math.max(1, Math.ceil(safeDays / 7))),
    daily: Math.ceil(remaining / safeDays),
    isPastDeadline: days < 0,
  };
}

export interface CompletionEstimate {
  monthsNeeded: number;
  estimatedDate: ISODate;
}

/** ¿Cuándo llego a la meta si ahorro un monto fijo por mes? */
export function simulateCompletion(target: number, saved: number, monthlyContribution: number, today: ISODate): CompletionEstimate | null {
  const remaining = Math.max(0, target - saved);
  if (remaining === 0) return { monthsNeeded: 0, estimatedDate: today };
  if (monthlyContribution <= 0) return null;
  const monthsNeeded = Math.ceil(remaining / monthlyContribution);
  return { monthsNeeded, estimatedDate: addMonths(today, monthsNeeded) };
}

export interface ProjectionPoint {
  label: string;
  saved: number;
  target: number;
}

/** Proyección mes a mes del monto acumulado con un aporte fijo. */
export function buildSavingsProjection(target: number, saved: number, monthly: number, months: number, today: ISODate): ProjectionPoint[] {
  const startKey = getMonthKey(today);
  const limit = clamp(Math.ceil(months), 1, 60);
  return Array.from({ length: limit + 1 }, (_, index) => ({
    label: getMonthLabel(shiftMonth(startKey, index), 'short-year'),
    saved: Math.min(target, saved + monthly * index),
    target,
  }));
}

export type Feasibility = 'comfortable' | 'tight' | 'unrealistic' | 'unknown';

/** Compara el ahorro mensual necesario con la capacidad de ahorro promedio del usuario. */
export function assessFeasibility(monthlyNeeded: number, capacity: number): { level: Feasibility; ratio: number | null } {
  if (monthlyNeeded <= 0) return { level: 'comfortable', ratio: 0 };
  if (capacity <= 0) return { level: 'unknown', ratio: null };
  const ratio = (monthlyNeeded / capacity) * 100;
  if (ratio <= 50) return { level: 'comfortable', ratio };
  if (ratio <= 100) return { level: 'tight', ratio };
  return { level: 'unrealistic', ratio };
}
