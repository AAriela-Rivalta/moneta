import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Landmark,
  Receipt,
  Scale,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { BalanceTrendChart } from "@/components/charts/BalanceTrendChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { PeriodSelector } from "@/components/shared/PeriodSelector";
import { TransactionItem } from "@/components/shared/TransactionItem";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useAppData } from "@/context/app-data/useAppData";
import { usePeriod } from "@/context/period/usePeriod";
import { useToast } from "@/context/toast/useToast";
import { getBudgetStatuses } from "@/domain/budgets";
import {
  compareWithPreviousMonth,
  getCategoryBreakdown,
  getMonthEndBalance,
  getMonthlySeries,
  getSavingsContributions,
  getSavingsRate,
  trimLeadingEmptyMonths,
} from "@/domain/statistics";
import {
  getRecentTransactions,
  getTransactionsInMonth,
} from "@/domain/transactions";
import { useAssistantReport } from "@/hooks/useAssistantReport";
import { useCategories } from "@/hooks/useCategories";
import { useCurrency } from "@/hooks/useCurrency";
import { getMonthBounds, getMonthLabel, todayISO } from "@/lib/dates";
import { formatPercent } from "@/lib/format";
import { percentChange } from "@/lib/math";
import { BudgetWatchCard } from "./components/BudgetWatchCard";
import { InsightsPreviewCard } from "./components/InsightsPreviewCard";

export default function DashboardPage() {
  const { data, actions } = useAppData();
  const { monthKey } = usePeriod();
  const { categoryMap } = useCategories();
  const { format } = useCurrency();
  const toast = useToast();
  const report = useAssistantReport(monthKey);

  const stats = useMemo(() => {
    const { transactions } = data;
    const monthTxs = getTransactionsInMonth(transactions, monthKey);
    const comparison = compareWithPreviousMonth(transactions, monthKey);
    const balance = getMonthEndBalance(transactions, monthKey);
    const previousBalance = getMonthEndBalance(
      transactions,
      comparison.previousMonthKey,
    );
    return {
      comparison,
      balance,
      balanceChange: percentChange(balance, previousBalance),
      savingsRate: getSavingsRate(
        comparison.current,
        getSavingsContributions(monthTxs),
      ),
      series: getMonthlySeries(transactions, monthKey, 6),
      evolution: trimLeadingEmptyMonths(
        getMonthlySeries(transactions, monthKey, 12),
      ),
      breakdown: getCategoryBreakdown(monthTxs, categoryMap, "expense"),
      recent: getRecentTransactions(
        transactions,
        6,
        getMonthBounds(monthKey).end,
      ),
      budgets: getBudgetStatuses(
        data.budgets,
        transactions,
        categoryMap,
        monthKey,
        todayISO(),
      ),
    };
  }, [data, monthKey, categoryMap]);

  const { comparison } = stats;
  const monthLabel = getMonthLabel(monthKey);
  const previousCaption = `vs. ${getMonthLabel(comparison.previousMonthKey, "short").toLowerCase()}`;
  const greeting = data.settings.userName
    ? `Hola, ${data.settings.userName}`
    : "Hola";

  const header = (
    <PageHeader
      title={greeting}
      description={`Este es el resumen de tus finanzas de ${monthLabel.toLowerCase()}.`}
      actions={<PeriodSelector />}
    />
  );

  if (data.transactions.length === 0) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Sparkles}
            title="Tu dashboard está listo para empezar"
            description="Registrá tu primer ingreso o gasto y Moneta calculará automáticamente tu saldo, estadísticas y recomendaciones."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink
                  to="/app/movimientos?nuevo=ingreso"
                  variant="soft"
                  icon={ArrowUpCircle}
                >
                  Registrar ingreso
                </ButtonLink>
                <ButtonLink
                  to="/app/movimientos?nuevo=gasto"
                  variant="coral"
                  icon={ArrowDownCircle}
                >
                  Registrar gasto
                </ButtonLink>
                <Button
                  variant="ghost"
                  onClick={() => {
                    actions.loadDemoData();
                    toast.success("Datos de demostración cargados");
                  }}
                >
                  Cargar datos de demostración
                </Button>
              </div>
            }
          />
        </Card>
      </>
    );
  }

  const balanceDiff = comparison.current.balance - comparison.previous.balance;

  return (
    <>
      {header}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores del mes"
      >
        <StatCard
          featured
          label="Saldo disponible"
          value={format(stats.balance)}
          icon={Landmark}
          delta={{
            value: stats.balanceChange,
            goodWhenPositive: true,
            caption: previousCaption,
          }}
        />
        <StatCard
          label="Ingresos del mes"
          value={format(comparison.current.income)}
          icon={ArrowUpCircle}
          tone="brand"
          delta={{
            value: comparison.changes.income,
            goodWhenPositive: true,
            caption: previousCaption,
          }}
        />
        <StatCard
          label="Gastos del mes"
          value={format(comparison.current.expense)}
          icon={ArrowDownCircle}
          tone="coral"
          delta={{
            value: comparison.changes.expense,
            goodWhenPositive: false,
            caption: previousCaption,
          }}
        />
        <StatCard
          label="Balance mensual"
          value={format(comparison.current.balance, { signed: true })}
          icon={Scale}
          tone={comparison.current.balance < 0 ? "coral" : "success"}
          footer={
            <p className="text-xs text-ink-500">
              {stats.savingsRate === null
                ? "Sin ingresos en el mes"
                : `Ahorro: ${formatPercent(stats.savingsRate, 1)} de los ingresos`}
              {" · "}
              <span
                className={
                  balanceDiff < 0 ? "text-coral-600" : "text-emerald-700"
                }
              >
                {format(balanceDiff, { signed: true })} {previousCaption}
              </span>
            </p>
          }
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ingresos vs. gastos"
            description="Últimos 6 meses"
          />
          <CardBody>
            <IncomeExpenseChart data={stats.series} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Gastos por categoría" description={monthLabel} />
          <CardBody>
            {stats.breakdown.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="Sin gastos en este mes"
                description="Cuando registres gastos verás su distribución."
              />
            ) : (
              <CategoryDonutChart
                items={stats.breakdown}
                centerLabel="Gastado"
              />
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Evolución del saldo"
            description={`Saldo acumulado al cierre de cada mes · últimos ${stats.evolution.length} meses`}
          />
          <CardBody>
            <BalanceTrendChart data={stats.evolution} />
          </CardBody>
        </Card>
        <BudgetWatchCard statuses={stats.budgets} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Últimos movimientos"
            description={`Registrados hasta ${monthLabel.toLowerCase()}`}
            action={
              <Link
                to="/movimientos"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Ver todos <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          <CardBody className="pt-1">
            {stats.recent.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="Sin movimientos hasta este mes"
              />
            ) : (
              <div className="divide-y divide-ink-100">
                {stats.recent.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    category={categoryMap.get(tx.categoryId)}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <InsightsPreviewCard report={report} />
      </section>
    </>
  );
}
