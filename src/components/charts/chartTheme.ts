import { CHART_COLORS } from '@/config/palette';

/** Estilos compartidos de ejes y grilla: líneas finas, sólidas y recesivas. */
export const axisTick = { fill: CHART_COLORS.axis, fontSize: 12 } as const;

export const xAxisProps = {
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.grid },
  tick: axisTick,
  tickMargin: 8,
} as const;

export const yAxisProps = {
  tickLine: false,
  axisLine: false,
  tick: axisTick,
  width: 64,
} as const;

export const gridProps = {
  vertical: false,
  stroke: CHART_COLORS.grid,
} as const;

/** Convierte un id de React (useId) en un identificador válido para url(#id) en SVG. */
export const svgSafeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');
