import { RECOMMENDED_SAVINGS_RATE, SYSTEM_CATEGORY } from '@/config/constants';
import { formatNumber, formatPercent } from '@/lib/format';
import { percentChange, percentOf } from '@/lib/math';
import { suggestBudgetLimit } from '../budgets';
import { assessFeasibility, getGoalProgress } from '../goals';
import { normalizeText } from '../transactions';
import type { AnalysisContext } from './context';
import type { Insight } from './types';

type RuleResult = Omit<Insight, 'id'>;

export interface AssistantRule {
  id: string;
  name: string;
  description: string;
  evaluate: (ctx: AnalysisContext) => RuleResult[];
}

const pct = (value: number) => formatPercent(value, Math.abs(value) < 10 ? 1 : 0);
const months = (count: number) => `${formatNumber(count)} ${count === 1 ? 'mes' : 'meses'}`;

/** Proporción de una categoría que corresponde a gastos fijos detectados. */
function fixedShare(ctx: AnalysisContext, categoryId: string, amount: number): number {
  return amount > 0 ? Math.min(1, (ctx.fixedByCategory.get(categoryId) ?? 0) / amount) : 0;
}

/* ------------------------------------------------------------------ */

const monthlyBalanceRule: AssistantRule = {
  id: 'monthly-balance',
  name: 'Balance del mes',
  description: 'Compara ingresos y gastos del mes y alerta si el balance es negativo o faltan ingresos registrados.',
  evaluate(ctx) {
    const { totals, money } = ctx;
    if (totals.count === 0) return [];
    if (totals.income === 0 && totals.expense > 0) {
      return [
        {
          severity: 'warning',
          topic: 'income',
          title: `No registraste ingresos en ${ctx.monthLabel}`,
          message: `Llevás ${money(totals.expense)} en gastos sin ingresos asociados. Si ya cobraste, registralo para que el análisis sea preciso.`,
          action: { label: 'Registrar ingreso', to: '/app/movimientos?nuevo=ingreso' },
        },
      ];
    }
    if (totals.balance < 0) {
      return [
        {
          severity: 'critical',
          topic: 'balance',
          title: 'Gastaste más de lo que ingresó',
          message: `En ${ctx.monthLabel} tus gastos superan a tus ingresos por ${money(-totals.balance)}. Revisá las categorías con mayor consumo para equilibrar el mes.`,
          highlight: money(totals.balance),
          action: { label: 'Ver estadísticas', to: '/app/estadisticas' },
        },
      ];
    }
    return [];
  },
};

const savingsRateRule: AssistantRule = {
  id: 'savings-rate',
  name: 'Tasa de ahorro',
  description: `Calcula qué porcentaje de los ingresos se ahorra (sobrante del mes + aportes a objetivos) y lo compara con el ${RECOMMENDED_SAVINGS_RATE}% recomendado por la regla 50/30/20.`,
  evaluate(ctx) {
    const { savingsRate: rate, totals, money } = ctx;
    if (rate === null || rate < 0) return [];
    const saved = totals.balance + ctx.savingsContributions;
    const gap = Math.max(0, (totals.income * RECOMMENDED_SAVINGS_RATE) / 100 - saved);
    const inProgress = ctx.isCurrentMonth ? ' (el mes todavía está en curso)' : '';

    if (rate < 10) {
      return [
        {
          severity: 'warning',
          topic: 'savings',
          title: `Ahorrás solo el ${pct(rate)} de tus ingresos`,
          message: `Lo recomendable es destinar al menos el ${RECOMMENDED_SAVINGS_RATE}% al ahorro${inProgress}. Para lograrlo deberías ahorrar ${money(gap)} más este mes.`,
          highlight: pct(rate),
        },
      ];
    }
    if (rate < RECOMMENDED_SAVINGS_RATE) {
      return [
        {
          severity: 'info',
          topic: 'savings',
          title: `Ahorrás el ${pct(rate)} de tus ingresos`,
          message: `Vas por buen camino${inProgress}. Te faltan ${money(gap)} para alcanzar el ${RECOMMENDED_SAVINGS_RATE}% recomendado.`,
          highlight: pct(rate),
        },
      ];
    }
    return [
      {
        severity: 'success',
        topic: 'savings',
        title: `¡Excelente! Ahorrás el ${pct(rate)} de tus ingresos`,
        message: `Superás el ${RECOMMENDED_SAVINGS_RATE}% recomendado${inProgress}. Podés destinar el excedente a tus objetivos o a un fondo de emergencia.`,
        highlight: pct(rate),
      },
    ];
  },
};

const topCategoriesRule: AssistantRule = {
  id: 'top-categories',
  name: 'Categorías de mayor gasto',
  description:
    'Identifica dónde se concentra el gasto. Si la categoría principal es mayormente fija (alquiler, servicios), sugiere recortar la categoría variable de mayor peso.',
  evaluate(ctx) {
    const [top, second, third] = ctx.breakdown;
    if (!top) return [];
    const { money } = ctx;
    const followers = [second, third]
      .filter(Boolean)
      .map((item) => `${item.name} (${pct(item.percentage)})`)
      .join(' y ');

    const variable = ctx.breakdown
      .map((item) => ({ item, variable: item.amount * (1 - fixedShare(ctx, item.categoryId, item.amount)) }))
      .sort((a, b) => b.variable - a.variable)[0];
    const topIsFixed = fixedShare(ctx, top.categoryId, top.amount) >= 0.7;

    const suggestion =
      topIsFixed && variable && variable.item.categoryId !== top.categoryId
        ? ` Es mayormente un gasto fijo; la categoría variable con más consumo es ${variable.item.name}: reducirla un 10% te ahorraría ${money(variable.variable * 0.1)} por mes.`
        : ` Reducirla un 10% te permitiría ahorrar ${money(top.amount * 0.1)} por mes.`;

    return [
      {
        severity: top.percentage >= 40 && !topIsFixed ? 'warning' : 'info',
        topic: 'spending',
        title: top.percentage >= 40 ? `${top.name} concentra el ${pct(top.percentage)} de tus gastos` : `Tu mayor gasto es ${top.name}`,
        message: `En ${ctx.monthLabel} destinaste ${money(top.amount)} a ${top.name}${followers ? `; le siguen ${followers}` : ''}.${suggestion}`,
        highlight: pct(top.percentage),
        action: { label: 'Ver estadísticas', to: '/app/estadisticas' },
      },
    ];
  },
};

const spendingIncreaseRule: AssistantRule = {
  id: 'spending-increase',
  name: 'Aumentos respecto al mes anterior',
  description: 'Detecta subas de gasto total (≥ 15%) y por categoría (≥ 25% y con peso significativo) frente al mes anterior.',
  evaluate(ctx) {
    if (ctx.previousConsumption <= 0) return [];
    const { money } = ctx;
    const results: RuleResult[] = [];
    const stillRunning = ctx.isCurrentMonth ? ', y el mes todavía no terminó' : '';

    const totalChange = percentChange(ctx.consumption, ctx.previousConsumption);
    if (totalChange !== null && totalChange >= 15) {
      results.push({
        severity: 'warning',
        topic: 'spending',
        title: `Tus gastos aumentaron un ${pct(totalChange)}`,
        message: `Gastaste ${money(ctx.consumption)} en ${ctx.monthLabel} frente a ${money(ctx.previousConsumption)} en ${ctx.previousMonthLabel}${stillRunning}.`,
        highlight: `+${pct(totalChange)}`,
      });
    }

    const threshold = Math.max(ctx.previousConsumption * 0.03, 1);
    ctx.categoryComparison
      .filter((item) => item.previous > 0 && item.change !== null && item.change >= 25 && item.difference >= threshold)
      .sort((a, b) => b.difference - a.difference)
      .slice(0, 3)
      .forEach((item) => {
        results.push({
          severity: 'warning',
          topic: 'spending',
          title: `Subió tu gasto en ${item.name}`,
          message: `${money(item.current)} en ${ctx.monthLabel} contra ${money(item.previous)} en ${ctx.previousMonthLabel}: ${money(item.difference)} más${stillRunning}.`,
          highlight: `+${pct(item.change ?? 0)}`,
        });
      });

    const newCategory = ctx.categoryComparison.find((item) => item.previous === 0 && item.current >= threshold * 2);
    if (newCategory) {
      results.push({
        severity: 'info',
        topic: 'spending',
        title: `Nuevo gasto en ${newCategory.name}`,
        message: `No tuviste gastos en esta categoría en ${ctx.previousMonthLabel} y en ${ctx.monthLabel} ya suman ${money(newCategory.current)}.`,
      });
    }
    return results;
  },
};

const spendingDecreaseRule: AssistantRule = {
  id: 'spending-decrease',
  name: 'Reducciones de gasto',
  description: 'Reconoce las categorías en las que gastaste al menos un 20% menos que el mes anterior (solo meses cerrados).',
  evaluate(ctx) {
    if (ctx.isCurrentMonth || ctx.previousConsumption <= 0) return [];
    const threshold = Math.max(ctx.previousConsumption * 0.03, 1);
    return ctx.categoryComparison
      .filter((item) => item.previous > 0 && item.change !== null && item.change <= -20 && -item.difference >= threshold)
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 2)
      .map((item) => ({
        severity: 'success' as const,
        topic: 'spending' as const,
        title: `Bajaste tu gasto en ${item.name}`,
        message: `Gastaste ${ctx.money(item.current)}, ${ctx.money(-item.difference)} menos que en ${ctx.previousMonthLabel}. ¡Buen trabajo!`,
        highlight: pct(item.change ?? 0),
      }));
  },
};

const budgetsRule: AssistantRule = {
  id: 'budgets',
  name: 'Control de presupuestos',
  description: 'Alerta cuando una categoría alcanza el 80% de su presupuesto y cuando lo supera, con el monto diario disponible hasta fin de mes.',
  evaluate(ctx) {
    const statuses = ctx.budgetStatuses;
    if (statuses.length === 0) return [];
    const { money } = ctx;
    const results: RuleResult[] = [];
    const budgetsAction = { label: 'Ver presupuestos', to: '/app/presupuestos' };

    for (const status of statuses) {
      const name = status.category?.name ?? 'Sin categoría';
      if (status.level === 'exceeded') {
        results.push({
          severity: 'critical',
          topic: 'budget',
          title: `Superaste el presupuesto de ${name}`,
          message: `Gastaste ${money(status.spent)} de ${money(status.budget.limit)}: te excediste por ${money(-status.remaining)}.${
            ctx.isCurrentMonth ? ' Intentá no sumar gastos en esta categoría hasta fin de mes.' : ''
          }`,
          highlight: pct(status.percentage),
          action: budgetsAction,
        });
      } else if (status.level === 'warning') {
        results.push({
          severity: 'warning',
          topic: 'budget',
          title: `${name}: usaste el ${pct(status.percentage)} del presupuesto`,
          message:
            status.remaining > 0 && status.dailyAllowance && status.daysLeft
              ? `Te quedan ${money(status.remaining)} para los próximos ${status.daysLeft} días (≈ ${money(status.dailyAllowance)} por día).`
              : `Ya consumiste el límite de ${money(status.budget.limit)} para este mes.`,
          highlight: pct(status.percentage),
          action: budgetsAction,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        severity: 'success',
        topic: 'budget',
        title: 'Tus presupuestos están bajo control',
        message: `Ninguna de las ${statuses.length} categorías presupuestadas llegó al 80% de su límite en ${ctx.monthLabel}.`,
      });
    }
    return results;
  },
};

const missingBudgetsRule: AssistantRule = {
  id: 'missing-budgets',
  name: 'Categorías sin presupuesto',
  description: 'Sugiere presupuestar las categorías variables con más peso que todavía no tienen límite, proponiendo un monto según el historial.',
  evaluate(ctx) {
    if (ctx.breakdown.length === 0) return [];
    const budgeted = new Set(ctx.budgetStatuses.map((status) => status.budget.categoryId));
    const action = { label: 'Crear presupuesto', to: '/app/presupuestos' };

    if (budgeted.size === 0) {
      const target = ctx.breakdown.find((item) => fixedShare(ctx, item.categoryId, item.amount) < 0.7) ?? ctx.breakdown[0];
      return [
        {
          severity: 'info',
          topic: 'budget',
          title: `Todavía no definiste presupuestos para ${ctx.monthLabel}`,
          message: `Poner límites por categoría te ayuda a controlar el gasto. Podés empezar por ${target.name}, una de tus categorías variables con más consumo.`,
          action,
        },
      ];
    }

    return ctx.breakdown
      .filter((item) => !budgeted.has(item.categoryId) && item.percentage >= 10 && fixedShare(ctx, item.categoryId, item.amount) < 0.7)
      .slice(0, 2)
      .map((item) => {
        const suggested = suggestBudgetLimit(ctx.data.transactions, item.categoryId, ctx.monthKey);
        return {
          severity: 'info' as const,
          topic: 'budget' as const,
          title: `Definí un presupuesto para ${item.name}`,
          message: `Representa el ${pct(item.percentage)} de tus gastos y no tiene límite asignado.${
            suggested ? ` Según tu historial, un límite de ${ctx.money(suggested)} sería razonable.` : ''
          }`,
          action,
        };
      });
  },
};

const projectionRule: AssistantRule = {
  id: 'month-projection',
  name: 'Proyección de cierre',
  description: 'Para el mes en curso, proyecta el gasto final sumando gastos fijos (pagados y pendientes) y extrapolando el ritmo diario del gasto variable.',
  evaluate(ctx) {
    const { projection, money } = ctx;
    if (!projection || ctx.dayOfMonth < 5 || ctx.totals.income === 0) return [];
    if (projection.balance < 0) {
      return [
        {
          severity: 'warning',
          topic: 'balance',
          title: `A este ritmo cerrarías ${ctx.monthLabel} en negativo`,
          message: `Proyectamos gastos por ${money(projection.expense)} frente a ingresos de ${money(ctx.totals.income)}. Déficit estimado: ${money(-projection.balance)}.`,
          highlight: money(projection.balance),
        },
      ];
    }
    return [
      {
        severity: 'info',
        topic: 'balance',
        title: `Proyección de cierre de ${ctx.monthLabel}`,
        message: `Si mantenés el ritmo actual, terminarías el mes con un saldo a favor de ${money(projection.balance)} (gastos estimados: ${money(projection.expense)}).`,
        highlight: money(projection.balance),
      },
    ];
  },
};

const incomeChangeRule: AssistantRule = {
  id: 'income-change',
  name: 'Variación de ingresos',
  description: 'Advierte caídas de ingresos ≥ 15% (meses cerrados) y celebra aumentos ≥ 10% respecto al mes anterior.',
  evaluate(ctx) {
    const current = ctx.totals.income;
    const previous = ctx.previousTotals.income;
    if (previous <= 0 || current <= 0) return [];
    const change = percentChange(current, previous) ?? 0;

    if (!ctx.isCurrentMonth && change <= -15) {
      return [
        {
          severity: 'warning',
          topic: 'income',
          title: `Tus ingresos bajaron un ${pct(-change)}`,
          message: `Ingresaron ${ctx.money(current)} contra ${ctx.money(previous)} en ${ctx.previousMonthLabel}. Ajustá tus presupuestos para acompañar la baja.`,
          highlight: pct(change),
        },
      ];
    }
    if (change >= 10) {
      return [
        {
          severity: 'success',
          topic: 'income',
          title: `Tus ingresos crecieron un ${pct(change)}`,
          message: `Recibiste ${ctx.money(current - previous)} más que en ${ctx.previousMonthLabel}. Si destinás esa diferencia al ahorro, tu tasa de ahorro mejora notablemente.`,
          highlight: `+${pct(change)}`,
        },
      ];
    }
    return [];
  },
};

const smallExpensesRule: AssistantRule = {
  id: 'small-expenses',
  name: 'Gastos hormiga',
  description: 'Agrupa los gastos pequeños (≤ 1,5% de los ingresos) y avisa si en conjunto superan el 5% del gasto mensual.',
  evaluate(ctx) {
    if (ctx.consumption <= 0) return [];
    const reference = ctx.totals.income > 0 ? ctx.totals.income : ctx.consumption;
    const limit = Math.max(reference * 0.015, 1);
    const small = ctx.monthTxs.filter((tx) => tx.type === 'expense' && tx.categoryId !== SYSTEM_CATEGORY.savings && tx.amount <= limit);
    const total = small.reduce((sum, tx) => sum + tx.amount, 0);
    const share = percentOf(total, ctx.consumption);
    if (small.length < 6 || share < 5) return [];
    return [
      {
        severity: 'info',
        topic: 'spending',
        title: 'Los gastos chicos también suman',
        message: `Registraste ${small.length} gastos menores a ${ctx.money(limit)} que suman ${ctx.money(total)} (${pct(share)} de tus gastos). Por separado parecen poco, pero juntos tienen peso.`,
        highlight: ctx.money(total),
      },
    ];
  },
};

const recurringRule: AssistantRule = {
  id: 'recurring',
  name: 'Gastos recurrentes',
  description:
    'Detecta gastos que se repiten mensualmente (misma descripción y categoría en 3 o más meses, con montos estables) y calcula su peso sobre los ingresos.',
  evaluate(ctx) {
    if (ctx.recurring.length === 0) return [];
    const total = ctx.recurring.reduce((sum, item) => sum + item.averageAmount, 0);
    const share = ctx.totals.income > 0 ? percentOf(total, ctx.totals.income) : null;
    const high = share !== null && share > 60;
    const results: RuleResult[] = [
      {
        severity: high ? 'warning' : 'info',
        topic: 'recurring',
        title: `Detectamos ${ctx.recurring.length} gastos recurrentes`,
        message: `Suman aproximadamente ${ctx.money(total)} por mes${share !== null ? ` (${pct(share)} de tus ingresos)` : ''}. ${
          high ? 'Tus gastos fijos son altos: revisá si podés renegociar o dar de baja alguno.' : 'Revisá periódicamente si todos siguen siendo necesarios.'
        }`,
        highlight: ctx.money(total),
      },
    ];

    const subscriptions = ctx.recurring.filter((item) => normalizeText(item.categoryName).includes('suscrip'));
    if (subscriptions.length >= 2) {
      const monthly = subscriptions.reduce((sum, item) => sum + item.averageAmount, 0);
      results.push({
        severity: 'info',
        topic: 'recurring',
        title: `Tenés ${subscriptions.length} suscripciones activas`,
        message: `Pagás ${ctx.money(monthly)} por mes (${ctx.money(monthly * 12)} al año). Verificá que las sigas usando todas.`,
      });
    }
    return results;
  },
};

const goalsRule: AssistantRule = {
  id: 'goals',
  name: 'Objetivos de ahorro',
  description:
    'Calcula el ahorro mensual necesario para cada objetivo y lo compara con tu capacidad de ahorro promedio de los últimos 3 meses cerrados.',
  evaluate(ctx) {
    const { money } = ctx;
    const goals = ctx.data.goals;
    const action = { label: 'Ver objetivos', to: 	'/app/objetivos' };

    if (goals.length === 0) {
      return [
        {
          severity: 'info',
          topic: 'goal',
          title: 'Creá tu primer objetivo de ahorro',
          message: `Ponerle nombre, monto y fecha a una meta aumenta las chances de cumplirla.${
            ctx.capacity > 0 ? ` Tu capacidad de ahorro promedio es de ${money(ctx.capacity)} por mes.` : ''
          }`,
          action: { label: 'Crear objetivo', to: '/app/objetivos?nuevo=1' },
        },
      ];
    }

    const results: RuleResult[] = [];
    const progress = goals.map((goal) => ({ goal, progress: getGoalProgress(goal, ctx.today) }));

    for (const { goal, progress: p } of progress) {
      if (p.status === 'overdue') {
        results.push({
          severity: 'critical',
          topic: 'goal',
          title: `El objetivo "${goal.name}" venció`,
          message: `Te faltaron ${money(p.remaining)}. Podés extender la fecha límite o ajustar el monto objetivo.`,
          action,
        });
      } else if (p.status === 'completed') {
        results.push({
          severity: 'success',
          topic: 'goal',
          title: `¡Alcanzaste el objetivo "${goal.name}"!`,
          message: `Reuniste ${money(goal.savedAmount)}. Es un buen momento para definir tu próxima meta.`,
        });
      }
    }

    const active = progress.filter((item) => item.progress.status === 'active');
    if (active.length === 0) return results;
    const totalNeeded = active.reduce((sum, item) => sum + item.progress.monthlyNeeded, 0);

    if (ctx.capacity <= 0 && ctx.averageExpense > 0) {
      results.push({
        severity: 'warning',
        topic: 'goal',
        title: 'Tus objetivos no están avanzando',
        message: `En los últimos meses tus gastos igualaron o superaron tus ingresos. Para cumplir tus objetivos necesitás ahorrar ${money(totalNeeded)} por mes.`,
        action,
      });
    } else if (ctx.capacity > 0 && totalNeeded > ctx.capacity) {
      results.push({
        severity: 'warning',
        topic: 'goal',
        title: 'Tus objetivos requieren más de lo que ahorrás',
        message: `Para cumplirlos a tiempo necesitás ${money(totalNeeded)} por mes y tu capacidad promedio es de ${money(ctx.capacity)}. Priorizá uno o extendé los plazos.`,
        highlight: money(totalNeeded),
        action,
      });
    }

    const next = [...active].sort((a, b) => a.goal.deadline.localeCompare(b.goal.deadline))[0];
    const feasibility = assessFeasibility(next.progress.monthlyNeeded, ctx.capacity);
    const comment =
      feasibility.ratio === null
        ? ''
        : feasibility.level === 'comfortable'
          ? ` Representa el ${pct(feasibility.ratio)} de tu capacidad de ahorro: es alcanzable.`
          : feasibility.level === 'tight'
            ? ` Representa el ${pct(feasibility.ratio)} de tu capacidad de ahorro: es exigente pero posible.`
            : ` Supera tu capacidad de ahorro actual (${money(ctx.capacity)} por mes).`;

    results.push({
      severity: feasibility.level === 'unrealistic' ? 'warning' : 'info',
      topic: 'goal',
      title: `"${next.goal.name}": ahorrá ${money(next.progress.monthlyNeeded)} por mes`,
      message: `Te faltan ${money(next.progress.remaining)} y quedan ${months(next.progress.monthsLeft)} hasta la fecha límite.${comment}`,
      action,
    });
    return results;
  },
};

const emergencyFundRule: AssistantRule = {
  id: 'emergency-fund',
  name: 'Fondo de emergencia',
  description: 'Verifica si existe un objetivo de "emergencia" y si cubre entre 3 y 6 meses de tu gasto promedio.',
  evaluate(ctx) {
    if (ctx.averageExpense <= 0) return [];
    const { money } = ctx;
    const min = ctx.averageExpense * 3;
    const max = ctx.averageExpense * 6;
    const fund = ctx.data.goals.find((goal) => normalizeText(goal.name).includes('emergencia'));

    if (!fund) {
      return [
        {
          severity: 'info',
          topic: 'savings',
          title: 'Considerá armar un fondo de emergencia',
          message: `Se recomienda reservar entre 3 y 6 meses de gastos para imprevistos. Según tu promedio, serían entre ${money(min)} y ${money(max)}.`,
          action: { label: 'Crear objetivo', to: '/app/objetivos?nuevo=1' },
        },
      ];
    }
    const coverage = fund.savedAmount / ctx.averageExpense;
    return [
      {
        severity: coverage >= 3 ? 'success' : 'info',
        topic: 'savings',
        title: `Tu fondo de emergencia cubre ${formatNumber(coverage, 1)} meses de gastos`,
        message:
          coverage >= 3
            ? 'Estás dentro del rango recomendado de 3 a 6 meses. ¡Muy bien!'
            : `Lo ideal es cubrir de 3 a 6 meses (${money(min)} a ${money(max)}). Te faltan ${money(min - fund.savedAmount)} para el mínimo.`,
        highlight: `${formatNumber(coverage, 1)} meses`,
      },
    ];
  },
};

/** Reglas en orden de evaluación. Agregar una regla nueva = sumar un objeto a esta lista. */
export const ASSISTANT_RULES: readonly AssistantRule[] = [
  monthlyBalanceRule,
  budgetsRule,
  projectionRule,
  spendingIncreaseRule,
  savingsRateRule,
  topCategoriesRule,
  goalsRule,
  incomeChangeRule,
  recurringRule,
  smallExpensesRule,
  missingBudgetsRule,
  emergencyFundRule,
  spendingDecreaseRule,
];
