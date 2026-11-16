import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { gridProps, svgSafeId, xAxisProps, yAxisProps } from '@/components/charts/chartTheme';
import { CHART_COLORS } from '@/config/palette';
import type { ProjectionPoint } from '@/domain/goals';
import { useCurrency } from '@/hooks/useCurrency';

/** Proyección del monto acumulado mes a mes, con la meta como línea de referencia. */
export function ProjectionChart({ data, target }: { data: ProjectionPoint[]; target: number }) {
  const { format } = useCurrency();
  const gradientId = `projection-${svgSafeId(useId())}`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.income} stopOpacity={0.2} />
            <stop offset="100%" stopColor={CHART_COLORS.income} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...xAxisProps} minTickGap={16} />
        <YAxis {...yAxisProps} domain={[0, Math.ceil(target * 1.05)]} tickFormatter={(value: number) => format(value, { compact: true })} />
        <ReferenceLine
          y={target}
          stroke={CHART_COLORS.expense}
          strokeWidth={1.5}
          label={{ value: 'Meta', position: 'insideTopRight', fill: '#cf4129', fontSize: 12, fontWeight: 600 }}
        />
        <Tooltip cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }} content={<ChartTooltip formatValue={format} />} />
        <Area type="monotone" dataKey="saved" name="Ahorro proyectado" stroke={CHART_COLORS.income} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
