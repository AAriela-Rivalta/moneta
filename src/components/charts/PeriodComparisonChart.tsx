import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/config/palette';
import type { CategoryComparisonItem } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartLegend } from './ChartLegend';
import { CategoryTick } from './CategoryTick';
import { ChartTooltip } from './ChartTooltip';

interface PeriodComparisonChartProps {
  items: CategoryComparisonItem[];
  currentLabel: string;
  previousLabel: string;
}

/** Compara dos períodos por categoría: el período principal en coral, el de referencia en gris. */
export function PeriodComparisonChart({ items, currentLabel, previousLabel }: PeriodComparisonChartProps) {
  const { format } = useCurrency();
  const height = Math.max(180, items.length * 52 + 16);

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={[
          { label: currentLabel, color: CHART_COLORS.expense },
          { label: previousLabel, color: CHART_COLORS.neutral },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={items} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barGap={2} barCategoryGap={12}>
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} tickFormatter={(value: number) => format(value, { compact: true })} />
          <YAxis type="category" dataKey="name" width={136} tickLine={false} axisLine={false} tick={<CategoryTick />} />
          <Tooltip cursor={{ fill: CHART_COLORS.cursor }} content={<ChartTooltip formatValue={format} />} />
          <Bar dataKey="current" name={currentLabel} fill={CHART_COLORS.expense} radius={[0, 4, 4, 0]} maxBarSize={14} />
          <Bar dataKey="previous" name={previousLabel} fill={CHART_COLORS.neutral} radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
