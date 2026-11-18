import { ArrowRight, Wallet } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getBudgetLevelLabel, type BudgetStatus } from "@/domain/budgets";
import { BUDGET_LEVEL_UI } from "@/features/budgets/budgetUi";
import { useCurrency } from "@/hooks/useCurrency";
import { formatPercent } from "@/lib/format";

/** Presupuestos del mes ordenados por consumo: primero los que están por agotarse. */
export function BudgetWatchCard({ statuses }: { statuses: BudgetStatus[] }) {
  const { format } = useCurrency();
  const alerts = statuses.filter((status) => status.level !== "ok").length;
  const visible = statuses.slice(0, 4);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Presupuestos"
        description={
          statuses.length === 0
            ? "Límites de gasto del mes"
            : alerts > 0
              ? `${alerts} próximos a agotarse o excedidos`
              : "Todos dentro del límite"
        }
        action={
          statuses.length > 0 && (
            <Link
              to="/app/presupuestos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver todos <ArrowRight className="size-4" aria-hidden />
            </Link>
          )
        }
      />
      <CardBody className="flex-1">
        {visible.length === 0 ? (
          <EmptyState
            compact
            icon={Wallet}
            title="Sin presupuestos este mes"
            description="Definí límites por categoría para recibir alertas."
            action={
              <ButtonLink to="/app/presupuestos" size="sm" variant="soft">
                Crear presupuesto
              </ButtonLink>
            }
          />
        ) : (
          <ul className="space-y-4">
            {visible.map((status) => (
              <li key={status.budget.id} className="flex items-start gap-3">
                <CategoryIcon
                  icon={status.category?.icon ?? "more"}
                  color={status.category?.color ?? "#a3a9b1"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink-800">
                      {status.category?.name ?? "Sin categoría"}
                    </span>
                    {status.level === "ok" ? (
                      <span className="text-sm font-semibold text-ink-700 tabular-nums">
                        {formatPercent(status.percentage)}
                      </span>
                    ) : (
                      <Badge tone={BUDGET_LEVEL_UI[status.level].badge}>
                        {formatPercent(status.percentage)} ·{" "}
                        {getBudgetLevelLabel(status)}
                      </Badge>
                    )}
                  </div>
                  <ProgressBar
                    value={status.percentage}
                    tone={BUDGET_LEVEL_UI[status.level].progress}
                    size="sm"
                    label={`Consumo de ${status.category?.name}`}
                  />
                  <p className="mt-1 text-xs text-ink-500 tabular-nums">
                    {format(status.spent)} de {format(status.budget.limit)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
