import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/config/palette';
import type { CategoryBreakdownItem } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPercent } from '@/lib/format';
import { CategoryTick } from './CategoryTick';
import { ChartTooltip } from './ChartTooltip';
import { axisTick } from './chartTheme';

interface CategoryRankingChartProps {
  items: CategoryBreakdownItem[];
  color?: string;
  seriesName?: string;
}

/** Ranking horizontal de categorías (una sola serie, un solo color). */
export function CategoryRankingChart({ items, color = CHART_COLORS.expense, seriesName = 'Gasto' }: CategoryRankingChartProps) {
  const { format } = useCurrency();
  const height = Math.max(160, items.length * 40 + 16);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={items} layout="vertical" margin={{ top: 0, right: 72, left: 0, bottom: 0 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={136} tickLine={false} axisLine={false} tick={<CategoryTick />} />
        <Tooltip
          cursor={{ fill: CHART_COLORS.cursor }}
          content={
            <ChartTooltip
              formatValue={format}
              renderFooter={(datum) => (
                <p className="flex justify-between gap-4 text-xs">
                  <span className="text-ink-500">Participación</span>
                  <span className="font-semibold text-ink-900 tabular-nums">{formatPercent(Number(datum.percentage ?? 0), 1)}</span>
                </p>
              )}
            />
          }
        />
        <Bar dataKey="amount" name={seriesName} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList
            dataKey="amount"
            position="right"
            offset={8}
            style={{ ...axisTick, fill: '#4f5660', fontWeight: 600 }}
            formatter={(value: unknown) => format(Number(value), { compact: true })}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
