import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChartColumnBig,
  PiggyBank,
  Receipt,
  Scale,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { CategoryRankingChart } from "@/components/charts/CategoryRankingChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { NetBalanceChart } from "@/components/charts/NetBalanceChart";
import { WeekdayChart } from "@/components/charts/WeekdayChart";
import { PeriodSelector } from "@/components/shared/PeriodSelector";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatCard } from "@/components/ui/StatCard";
import { useAppData } from "@/context/app-data/useAppData";
import { usePeriod } from "@/context/period/usePeriod";
import {
  getCategoryBreakdown,
  getMonthlySeries,
  getSavingsContributions,
  getSavingsRate,
  getTotals,
  getTransactionsInRange,
  getWeekdayExpenses,
} from "@/domain/statistics";
import { useCategories } from "@/hooks/useCategories";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDate, getMonthLabel, shiftMonth } from "@/lib/dates";
import { formatPercent } from "@/lib/format";
import type { TransactionType } from "@/types/finance";
import { PeriodComparisonSection } from "./components/PeriodComparisonSection";

type RangeOption = "3" | "6" | "12";

const RANGE_OPTIONS = [
  { value: "3" as const, label: "3 meses" },
  { value: "6" as const, label: "6 meses" },
  { value: "12" as const, label: "12 meses" },
];

const TYPE_OPTIONS = [
  { value: "expense" as const, label: "Gastos" },
  { value: "income" as const, label: "Ingresos" },
];

export default function StatisticsPage() {
  const { data } = useAppData();
  const { monthKey } = usePeriod();
  const { categoryMap } = useCategories();
  const { format } = useCurrency();
  const [range, setRange] = useState<RangeOption>("6");
  const [breakdownType, setBreakdownType] =
    useState<TransactionType>("expense");

  const months = Number(range);
  const fromKey = shiftMonth(monthKey, -(months - 1));

  const stats = useMemo(() => {
    const rangeTxs = getTransactionsInRange(
      data.transactions,
      fromKey,
      monthKey,
    );
    const series = getMonthlySeries(data.transactions, monthKey, months);
    const totals = getTotals(rangeTxs);
    const activeMonths = Math.max(
      1,
      series.filter((point) => point.income > 0 || point.expense > 0).length,
    );
    const withData = series.filter(
      (point) => point.income > 0 || point.expense > 0,
    );
    const bestMonth = withData.length
      ? withData.reduce((best, point) =>
          point.balance > best.balance ? point : best,
        )
      : null;
    const highestExpenseMonth = withData.length
      ? withData.reduce((top, point) =>
          point.expense > top.expense ? point : top,
        )
      : null;
    const largestExpense = rangeTxs
      .filter((tx) => tx.type === "expense")
      .reduce<
        (typeof rangeTxs)[number] | null
      >((max, tx) => (!max || tx.amount > max.amount ? tx : max), null);

    return {
      rangeTxs,
      series,
      totals,
      activeMonths,
      savingsRate: getSavingsRate(totals, getSavingsContributions(rangeTxs)),
      expenseBreakdown: getCategoryBreakdown(rangeTxs, categoryMap, "expense"),
      breakdown: getCategoryBreakdown(rangeTxs, categoryMap, breakdownType),
      weekday: getWeekdayExpenses(rangeTxs),
      bestMonth,
      highestExpenseMonth,
      largestExpense,
    };
  }, [
    data.transactions,
    fromKey,
    monthKey,
    months,
    categoryMap,
    breakdownType,
  ]);

  const periodLabel = `${getMonthLabel(fromKey, "short-year")} – ${getMonthLabel(monthKey, "short-year")}`;

  const header = (
    <PageHeader
      title="Estadísticas"
      description={`Análisis detallado del período ${periodLabel}.`}
      actions={
        <>
          <SegmentedControl
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            ariaLabel="Rango de meses"
          />
          <PeriodSelector />
        </>
      }
    />
  );

  if (data.transactions.length === 0) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={ChartColumnBig}
            title="Todavía no hay datos para analizar"
            description="Las estadísticas se generan automáticamente a partir de tus movimientos."
            action={
              <ButtonLink to="/app/movimientos?nuevo=gasto">
                Registrar un movimiento
              </ButtonLink>
            }
          />
        </Card>
      </>
    );
  }

  const topCategories = stats.expenseBreakdown.slice(0, 8);

  return (
    <>
      {header}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Totales del período"
      >
        <StatCard
          label="Ingresos del período"
          value={format(stats.totals.income)}
          icon={ArrowUpCircle}
          tone="brand"
          footer={
            <p className="text-xs text-ink-500">
              Promedio mensual:{" "}
              {format(Math.round(stats.totals.income / stats.activeMonths))}
            </p>
          }
        />
        <StatCard
          label="Gastos del período"
          value={format(stats.totals.expense)}
          icon={ArrowDownCircle}
          tone="coral"
          footer={
            <p className="text-xs text-ink-500">
              Promedio mensual:{" "}
              {format(Math.round(stats.totals.expense / stats.activeMonths))}
            </p>
          }
        />
        <StatCard
          label="Balance del período"
          value={format(stats.totals.balance, { signed: true })}
          icon={Scale}
          tone={stats.totals.balance < 0 ? "coral" : "success"}
          footer={
            <p className="text-xs text-ink-500">
              {stats.totals.count} movimientos en {stats.activeMonths} meses con
              actividad
            </p>
          }
        />
        <StatCard
          label="Tasa de ahorro"
          value={
            stats.savingsRate === null
              ? "—"
              : formatPercent(stats.savingsRate, 1)
          }
          icon={PiggyBank}
          tone="ink"
          footer={
            <p className="text-xs text-ink-500">
              Sobrante + aportes a objetivos sobre ingresos
            </p>
          }
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Ingresos vs. gastos"
            description="Comparación mensual del período"
          />
          <CardBody>
            <IncomeExpenseChart data={stats.series} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Evolución mensual"
            description="Balance de cada mes (ingresos − gastos)"
          />
          <CardBody>
            <NetBalanceChart data={stats.series} height={280} />
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader
            title={
              breakdownType === "expense"
                ? "Gastos por categoría"
                : "Ingresos por categoría"
            }
            description={periodLabel}
            action={
              <SegmentedControl
                options={TYPE_OPTIONS}
                value={breakdownType}
                onChange={setBreakdownType}
                ariaLabel="Tipo de movimiento"
                size="sm"
              />
            }
          />
          <CardBody>
            {stats.breakdown.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="Sin movimientos de este tipo en el período"
              />
            ) : (
              <CategoryDonutChart
                items={stats.breakdown}
                centerLabel={
                  breakdownType === "expense" ? "Gastado" : "Ingresado"
                }
                layout="side"
              />
            )}
          </CardBody>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader
            title="Categorías con mayor consumo"
            description="Ranking de gasto acumulado en el período"
          />
          <CardBody>
            {topCategories.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="Sin gastos en el período"
              />
            ) : (
              <>
                <CategoryRankingChart items={topCategories} />
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-100 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
                        <th scope="col" className="py-2 pr-3 font-semibold">
                          Categoría
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-right font-semibold"
                        >
                          Promedio mensual
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-right font-semibold"
                        >
                          Participación
                        </th>
                        <th
                          scope="col"
                          className="py-2 pl-3 text-right font-semibold"
                        >
                          Movimientos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {topCategories.map((item) => (
                        <tr key={item.categoryId}>
                          <td className="py-2.5 pr-3 text-ink-700">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-ink-900 tabular-nums">
                            {format(
                              Math.round(item.amount / stats.activeMonths),
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-ink-600 tabular-nums">
                            {formatPercent(item.percentage, 1)}
                          </td>
                          <td className="py-2.5 pl-3 text-right text-ink-600 tabular-nums">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </section>

      <div className="mt-6">
        <PeriodComparisonSection selectedMonth={monthKey} />
      </div>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Gasto por día de la semana"
            description="¿Qué días gastás más? (sin aportes a objetivos)"
          />
          <CardBody>
            <WeekdayChart data={stats.weekday} />
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Datos destacados" description={periodLabel} />
          <CardBody>
            <dl className="divide-y divide-ink-100 text-sm">
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-500">Mejor mes (mayor balance)</dt>
                <dd className="text-right font-semibold text-ink-900">
                  {stats.bestMonth
                    ? `${getMonthLabel(stats.bestMonth.monthKey)} · ${format(stats.bestMonth.balance, { signed: true })}`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-500">Mes de mayor gasto</dt>
                <dd className="text-right font-semibold text-ink-900">
                  {stats.highestExpenseMonth
                    ? `${getMonthLabel(stats.highestExpenseMonth.monthKey)} · ${format(stats.highestExpenseMonth.expense)}`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-500">Gasto individual más alto</dt>
                <dd className="text-right font-semibold text-ink-900">
                  {stats.largestExpense ? (
                    <>
                      {format(stats.largestExpense.amount)}
                      <span className="block text-xs font-normal text-ink-500">
                        {stats.largestExpense.description} ·{" "}
                        {formatDate(stats.largestExpense.date)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-500">Categoría principal</dt>
                <dd className="flex items-center gap-2 text-right font-semibold text-ink-900">
                  {topCategories[0] ? (
                    <>
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: topCategories[0].color }}
                        aria-hidden
                      />
                      {topCategories[0].name} ·{" "}
                      {formatPercent(topCategories[0].percentage)}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-500">Porción de ingresos gastada</dt>
                <dd className="font-semibold text-ink-900">
                  {stats.totals.income > 0
                    ? formatPercent(
                        (stats.totals.expense / stats.totals.income) * 100,
                      )
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
