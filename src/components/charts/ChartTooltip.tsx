import type { ReactNode } from 'react';

interface TooltipEntry {
  name?: string | number;
  value?: unknown;
  color?: string;
  fill?: string;
  dataKey?: unknown;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  /** Inyectadas por Recharts. */
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** Formateo de valores (normalmente moneda). */
  formatValue: (value: number) => string;
  /** Contenido extra al pie, calculado a partir del dato del punto. */
  renderFooter?: (datum: Record<string, unknown>) => ReactNode;
  hideLabel?: boolean;
}

function entryColor(entry: TooltipEntry): string | undefined {
  const fromPayload = entry.payload?.color ?? entry.payload?.fill;
  return entry.color ?? (typeof fromPayload === 'string' ? fromPayload : undefined) ?? entry.fill;
}

/** Tooltip consistente para todos los gráficos de la aplicación. */
export function ChartTooltip({ active, payload, label, formatValue, renderFooter, hideLabel }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload ?? {};

  return (
    <div className="min-w-44 rounded-xl border border-ink-100 bg-white/95 px-3.5 py-2.5 text-sm shadow-soft backdrop-blur-sm">
      {!hideLabel && label !== undefined && label !== '' && <p className="mb-1.5 text-xs font-semibold text-ink-500">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={`${String(entry.dataKey ?? entry.name)}-${index}`} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-ink-600">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entryColor(entry) }} aria-hidden />
              {entry.name}
            </span>
            <span className="font-semibold text-ink-900 tabular-nums">{formatValue(Number(entry.value ?? 0))}</span>
          </li>
        ))}
      </ul>
      {renderFooter && <div className="mt-2 border-t border-ink-100 pt-2">{renderFooter(datum)}</div>}
    </div>
  );
}
