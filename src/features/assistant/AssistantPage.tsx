import { CalendarRange, PiggyBank, Repeat, ShoppingBag, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatCard } from '@/components/ui/StatCard';
import { usePeriod } from '@/context/period/usePeriod';
import type { InsightSeverity } from '@/domain/assistant';
import { useAssistantReport } from '@/hooks/useAssistantReport';
import { useCurrency } from '@/hooks/useCurrency';
import { getMonthLabel } from '@/lib/dates';
import { formatPercent } from '@/lib/format';
import { HealthScoreCard } from './components/HealthScoreCard';
import { HowItWorksCard } from './components/HowItWorksCard';
import { InsightCard } from './components/InsightCard';
import { RecurringExpensesCard } from './components/RecurringExpensesCard';

type InsightFilter = 'all' | 'alerts' | 'tips' | 'wins';

const FILTER_MATCH: Record<InsightFilter, (severity: InsightSeverity) => boolean> = {
  all: () => true,
  alerts: (severity) => severity === 'critical' || severity === 'warning',
  tips: (severity) => severity === 'info',
  wins: (severity) => severity === 'success',
};

export default function AssistantPage() {
  const { monthKey } = usePeriod();
  const { format } = useCurrency();
  const report = useAssistantReport(monthKey);
  const [filter, setFilter] = useState<InsightFilter>('all');

  const count = (key: InsightFilter) => report.insights.filter((insight) => FILTER_MATCH[key](insight.severity)).length;
  const visible = report.insights.filter((insight) => FILTER_MATCH[filter](insight.severity));
  const { metrics } = report;

  const filterOptions = [
    { value: 'all' as const, label: `Todas (${count('all')})` },
    { value: 'alerts' as const, label: `Alertas (${count('alerts')})` },
    { value: 'tips' as const, label: `Sugerencias (${count('tips')})` },
    { value: 'wins' as const, label: `Logros (${count('wins')})` },
  ];

  return (
    <>
      <PageHeader
        title="Asistente financiero"
        description={`Análisis automático de ${getMonthLabel(monthKey).toLowerCase()} generado a partir de tus movimientos, presupuestos y objetivos.`}
        actions={<PeriodSelector />}
      />

      {report.hasData && (
        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <HealthScoreCard score={report.score} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-2">
            <StatCard
              label="Tasa de ahorro"
              value={metrics.savingsRate === null ? '—' : formatPercent(metrics.savingsRate, 1)}
              icon={PiggyBank}
              tone="success"
              footer={<p className="text-xs text-ink-500">Ahorrado: {format(metrics.savedAmount)} de {format(metrics.income)} ingresados · meta 20%</p>}
            />
            <StatCard
              label="Gasto de consumo"
              value={format(metrics.consumption)}
              icon={ShoppingBag}
              tone="coral"
              delta={{ value: metrics.consumptionChange, goodWhenPositive: false, caption: 'vs. mes anterior (sin aportes de ahorro)' }}
            />
            <StatCard
              label="Gastos recurrentes"
              value={`${format(metrics.recurringTotal)}/mes`}
              icon={Repeat}
              tone="ink"
              footer={
                <p className="text-xs text-ink-500">
                  {metrics.recurringShare === null ? 'Sin ingresos para comparar' : `${formatPercent(metrics.recurringShare, 1)} de tus ingresos del mes`}
                </p>
              }
            />
            <StatCard
              label={report.projection ? 'Proyección de cierre' : 'Capacidad de ahorro'}
              value={report.projection ? format(report.projection.balance, { signed: true }) : format(Math.max(0, metrics.capacity))}
              icon={report.projection ? CalendarRange : TrendingUp}
              tone="brand"
              footer={
                <p className="text-xs text-ink-500">
                  {report.projection
                    ? `Saldo estimado a fin de mes · gastos proyectados ${format(report.projection.expense)}`
                    : 'Promedio mensual de los últimos 3 meses cerrados'}
                </p>
              }
            />
          </div>
        </section>
      )}

      <section aria-label="Recomendaciones">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Recomendaciones personalizadas</h2>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <SegmentedControl options={filterOptions} value={filter} onChange={setFilter} ariaLabel="Filtrar recomendaciones" size="sm" />
          </div>
        </div>
        {visible.length === 0 ? (
          <Card>
            <EmptyState compact icon={PiggyBank} title="No hay recomendaciones en esta categoría" description="Probá con otro filtro." />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>

      {report.hasData && (
        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="h-full">
            <CardHeader title="Dónde se va tu dinero" description="Categorías de mayor consumo del mes (sin aportes de ahorro)" />
            <CardBody>
              {report.topCategories.length === 0 ? (
                <EmptyState compact icon={ShoppingBag} title="Sin gastos de consumo este mes" />
              ) : (
                <ul className="space-y-4">
                  {report.topCategories.map((item, index) => (
                    <li key={item.categoryId} className="flex items-center gap-3">
                      <span className="w-4 text-sm font-semibold text-ink-400 tabular-nums">{index + 1}</span>
                      <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-ink-800">{item.name}</span>
                          <span className="font-semibold text-ink-900 tabular-nums">{format(item.amount)}</span>
                        </div>
                        <ProgressBar value={item.percentage} color={item.color} size="sm" label={item.name} />
                        <p className="mt-1 text-xs text-ink-500">
                          {formatPercent(item.percentage, 1)} del gasto · {item.count} movimientos
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <RecurringExpensesCard items={report.recurring} total={metrics.recurringTotal} />
        </section>
      )}

      <div className="mt-6">
        <HowItWorksCard />
      </div>
    </>
  );
}
