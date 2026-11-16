import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/config/palette';
import type { WeekdayPoint } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartTooltip } from './ChartTooltip';
import { gridProps, xAxisProps, yAxisProps } from './chartTheme';

/** Gasto acumulado por día de la semana (serie única). */
export function WeekdayChart({ data, height = 240 }: { data: WeekdayPoint[]; height?: number }) {
  const { format } = useCurrency();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="day" {...xAxisProps} />
        <YAxis {...yAxisProps} tickFormatter={(value: number) => format(value, { compact: true })} />
        <Tooltip
          cursor={{ fill: CHART_COLORS.cursor }}
          content={
            <ChartTooltip
              formatValue={format}
              renderFooter={(datum) => <p className="text-xs text-ink-500">{Number(datum.count ?? 0)} movimientos</p>}
            />
          }
        />
        <Bar dataKey="amount" name="Gasto" fill={CHART_COLORS.balance} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
