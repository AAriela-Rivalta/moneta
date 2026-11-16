import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/config/palette';
import type { MonthlyPoint } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPercent } from '@/lib/format';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { gridProps, xAxisProps, yAxisProps } from './chartTheme';

/** Balance mensual (ingresos - gastos): celeste si hubo superávit, coral si hubo déficit. */
export function NetBalanceChart({ data, height = 260 }: { data: MonthlyPoint[]; height?: number }) {
  const { format } = useCurrency();

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={[
          { label: 'Superávit', color: CHART_COLORS.income },
          { label: 'Déficit', color: CHART_COLORS.expense },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...xAxisProps} />
          <YAxis {...yAxisProps} tickFormatter={(value: number) => format(value, { compact: true })} />
          <ReferenceLine y={0} stroke={CHART_COLORS.axis} />
          <Tooltip
            cursor={{ fill: CHART_COLORS.cursor }}
            content={
              <ChartTooltip
                formatValue={(value) => format(value, { signed: true })}
                renderFooter={(datum) =>
                  datum.savingsRate === null || datum.savingsRate === undefined ? null : (
                    <p className="flex justify-between gap-4 text-xs">
                      <span className="text-ink-500">Tasa de ahorro</span>
                      <span className="font-semibold text-ink-900 tabular-nums">{formatPercent(Number(datum.savingsRate), 1)}</span>
                    </p>
                  )
                }
              />
            }
          />
          <Bar dataKey="balance" name="Balance mensual" radius={[4, 4, 4, 4]} maxBarSize={36}>
            {data.map((point) => (
              <Cell key={point.monthKey} fill={point.balance < 0 ? CHART_COLORS.expense : CHART_COLORS.income} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
