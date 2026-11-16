import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/config/palette';
import type { MonthlyPoint } from '@/domain/statistics';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/cn';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { gridProps, xAxisProps, yAxisProps } from './chartTheme';

interface IncomeExpenseChartProps {
  data: MonthlyPoint[];
  height?: number;
}

export function IncomeExpenseChart({ data, height = 280 }: IncomeExpenseChartProps) {
  const { format } = useCurrency();

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={[
          { label: 'Ingresos', color: CHART_COLORS.income },
          { label: 'Gastos', color: CHART_COLORS.expense },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...xAxisProps} />
          <YAxis {...yAxisProps} tickFormatter={(value: number) => format(value, { compact: true })} />
          <Tooltip
            cursor={{ fill: CHART_COLORS.cursor }}
            content={
              <ChartTooltip
                formatValue={format}
                renderFooter={(datum) => {
                  const balance = Number(datum.balance ?? 0);
                  return (
                    <p className="flex justify-between gap-4 text-xs">
                      <span className="text-ink-500">Balance</span>
                      <span className={cn('font-semibold tabular-nums', balance < 0 ? 'text-coral-600' : 'text-brand-700')}>{format(balance, { signed: true })}</span>
                    </p>
                  );
                }}
              />
            }
          />
          <Bar dataKey="income" name="Ingresos" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="expense" name="Gastos" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
