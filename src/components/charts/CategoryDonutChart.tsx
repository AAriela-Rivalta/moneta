import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { groupMinorCategories, type CategoryBreakdownItem } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { ChartTooltip } from './ChartTooltip';

interface CategoryDonutChartProps {
  items: CategoryBreakdownItem[];
  centerLabel?: string;
  /** "stacked": gráfico arriba y leyenda abajo. "side": leyenda al costado cuando la tarjeta es ancha. */
  layout?: 'stacked' | 'side';
  maxSlices?: number;
}

/**
 * Distribución por categoría: máximo `maxSlices` porciones + "Otras" para que siga
 * siendo legible. La leyenda muestra nombre, porcentaje y monto (no depende solo del color).
 */
export function CategoryDonutChart({ items, centerLabel = 'Total', layout = 'stacked', maxSlices = 5 }: CategoryDonutChartProps) {
  const { format } = useCurrency();
  const data = groupMinorCategories(items, maxSlices);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    // Container query: la leyenda pasa al costado solo si la tarjeta tiene espacio suficiente.
    <div className="@container">
      <div className={cn('flex flex-col gap-5', layout === 'side' && '@lg:flex-row @lg:items-center @lg:gap-8')}>
        <div className="relative mx-auto size-[200px] shrink-0">
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-ink-500">{centerLabel}</span>
            <span className="max-w-[120px] text-lg font-bold tracking-tight text-ink-900">{format(total, { compact: total >= 1_000_000 })}</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={data.length > 1 ? 1.5 : 0}
                startAngle={90}
                endAngle={-270}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((item) => (
                  <Cell key={item.categoryId} fill={item.color} />
                ))}
              </Pie>
              <Tooltip wrapperStyle={{ zIndex: 10 }} content={<ChartTooltip formatValue={format} hideLabel />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {data.map((item) => (
            <li key={item.categoryId} className="flex items-center gap-3 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-ink-700" title={item.name}>
                {item.name}
              </span>
              <span className="w-10 shrink-0 text-right text-xs font-medium text-ink-500 tabular-nums">{formatPercent(item.percentage, 0)}</span>
              <span className="min-w-20 shrink-0 text-right font-semibold text-ink-900 tabular-nums">
                {format(item.amount, { compact: item.amount >= 10_000_000 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
