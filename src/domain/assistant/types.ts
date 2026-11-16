import type { IconName } from '@/config/icons';
import type { ISODate, MonthKey } from '@/types/finance';
import type { CategoryBreakdownItem } from '../statistics';

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';

export type InsightTopic = 'balance' | 'savings' | 'spending' | 'budget' | 'goal' | 'recurring' | 'income';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  topic: InsightTopic;
  title: string;
  message: string;
  /** Dato clave que se destaca visualmente (ej.: "+32%"). */
  highlight?: string;
  action?: { label: string; to: string };
}

export interface RecurringExpense {
  key: string;
  description: string;
  categoryId: string;
  categoryName: string;
  color: string;
  icon: IconName;
  averageAmount: number;
  monthsDetected: number;
  /** Variación de montos entre meses (coeficiente de variación, en %). */
  variation: number;
  lastDate: ISODate;
  nextDate: ISODate;
  paidThisMonth: boolean;
}

export interface HealthScoreComponent {
  key: 'savings' | 'budgets' | 'trend' | 'goals';
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface HealthScore {
  total: number;
  label: string;
  tone: 'success' | 'brand' | 'warning' | 'coral';
  components: HealthScoreComponent[];
}

export interface MonthProjection {
  expense: number;
  balance: number;
}

export interface AssistantMetrics {
  income: number;
  /** Gastos de consumo (sin aportes a objetivos de ahorro). */
  consumption: number;
  savedAmount: number;
  savingsRate: number | null;
  consumptionChange: number | null;
  recurringTotal: number;
  recurringShare: number | null;
  capacity: number;
}

export interface AssistantReport {
  monthKey: MonthKey;
  hasData: boolean;
  insights: Insight[];
  recurring: RecurringExpense[];
  topCategories: CategoryBreakdownItem[];
  score: HealthScore;
  metrics: AssistantMetrics;
  projection: MonthProjection | null;
}
