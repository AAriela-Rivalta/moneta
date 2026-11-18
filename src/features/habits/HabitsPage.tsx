import { Activity, CalendarRange, Repeat } from "lucide-react";
import { useMemo } from "react";
import { PeriodSelector } from "@/components/shared/PeriodSelector";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useAppData } from "@/context/app-data/useAppData";
import { usePeriod } from "@/context/period/usePeriod";
import { buildHabitsReport } from "@/domain/habits";
import { useCategories } from "@/hooks/useCategories";
import { useCurrency } from "@/hooks/useCurrency";
import { formatNumber, formatPercent } from "@/lib/format";
import { MonthRhythmCard } from "./components/MonthRhythmCard";
import { RepeatPurchasesCard } from "./components/RepeatPurchasesCard";
import { StabilityCard } from "./components/StabilityCard";
import { RHYTHM_RANGE, STABILITY_UI } from "./habitUi";

const STABILITY_TONE = {
  stable: "success",
  variable: "ink",
  irregular: "coral",
} as const;

export default function HabitsPage() {
  const { data } = useAppData();
  const { monthKey } = usePeriod();
  const { categoryMap } = useCategories();
  const { currency, format } = useCurrency();

  const report = useMemo(
    () => buildHabitsReport(data.transactions, categoryMap, monthKey),
    [data.transactions, categoryMap, monthKey],
  );

  const dominant = report.rhythm.buckets.find(
    (bucket) => bucket.id === report.rhythm.dominant,
  );
  const steadiest = report.stability[0];

  const header = (
    <PageHeader
      title="Hábitos financieros"
      description="Descubrí cómo se distribuyen tus gastos, qué compras repetís y cuáles son tus categorías más estables."
      actions={<PeriodSelector />}
    />
  );

  if (data.transactions.length === 0) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Activity}
            title="Todavía no hay movimientos para analizar"
            description="Los hábitos se calculan a partir de tus gastos. Registrá el primero y volvé a esta pantalla."
            action={
              <ButtonLink to="/app/movimientos?nuevo=gasto">
                Registrar un gasto
              </ButtonLink>
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}

      <section
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Resumen de hábitos"
      >
        <StatCard
          label="Tramo de mayor gasto"
          value={dominant ? dominant.label : "Sin datos"}
          icon={CalendarRange}
          tone={dominant ? "coral" : "ink"}
          footer={
            <p className="text-xs break-all text-ink-500">
              {dominant
                ? `${RHYTHM_RANGE[dominant.id]} · ${format(dominant.amount)} · ${formatPercent(dominant.percentage, 1)}`
                : "No hay gastos de consumo en el mes seleccionado."}
            </p>
          }
        />
        <StatCard
          label="Compras repetidas"
          value={formatNumber(report.repeats.length)}
          icon={Repeat}
          tone="brand"
          footer={
            <p className="text-xs text-ink-500">
              {report.repeats.length === 0
                ? "Ninguna compra se repite lo suficiente en los últimos tres meses."
                : "Grupos detectados en los últimos tres meses."}
            </p>
          }
        />
        <StatCard
          label="Categoría más estable"
          value={steadiest ? steadiest.name : "Sin datos"}
          icon={Activity}
          tone={steadiest ? STABILITY_TONE[steadiest.level] : "ink"}
          footer={
            <p className="text-xs break-all text-ink-500">
              {steadiest
                ? `${STABILITY_UI[steadiest.level].label} · promedio ${format(steadiest.mean)}`
                : "Hace falta gasto en al menos dos de los últimos tres meses."}
            </p>
          }
        />
      </section>

      <div className="mt-6 space-y-6">
        <MonthRhythmCard rhythm={report.rhythm} currency={currency} />
        <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
          <RepeatPurchasesCard items={report.repeats} currency={currency} />
          <StabilityCard items={report.stability} currency={currency} />
        </section>
      </div>
    </>
  );
}
