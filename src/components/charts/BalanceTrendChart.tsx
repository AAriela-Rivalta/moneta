import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/config/palette';
import type { MonthlyPoint } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { ChartTooltip } from './ChartTooltip';
import { gridProps, svgSafeId, xAxisProps, yAxisProps } from './chartTheme';

interface BalanceTrendChartProps {
  data: MonthlyPoint[];
  height?: number;
}

/** Evolución del saldo acumulado al cierre de cada mes (serie única, sin leyenda). */
export function BalanceTrendChart({ data, height = 260 }: BalanceTrendChartProps) {
  const { format } = useCurrency();
  const gradientId = `balance-${svgSafeId(useId())}`;
  const hasNegative = data.some((point) => point.cumulativeBalance < 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.balance} stopOpacity={0.16} />
            <stop offset="100%" stopColor={CHART_COLORS.balance} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} />
        <YAxis {...yAxisProps} tickFormatter={(value: number) => format(value, { compact: true })} />
        {hasNegative && <ReferenceLine y={0} stroke={CHART_COLORS.axis} />}
        <Tooltip cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }} content={<ChartTooltip formatValue={format} />} />
        <Area
          type="monotone"
          dataKey="cumulativeBalance"
          name="Saldo al cierre"
          stroke={CHART_COLORS.balance}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
