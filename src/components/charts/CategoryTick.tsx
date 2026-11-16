import { CHART_COLORS } from '@/config/palette';

interface CategoryTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  maxLength?: number;
}

/** Etiqueta del eje de categorías: recorta nombres largos y muestra el completo al pasar el mouse. */
export function CategoryTick({ x, y, payload, maxLength = 18 }: CategoryTickProps) {
  const text = payload?.value ?? '';
  const label = text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={CHART_COLORS.axis} fontSize={12}>
      <title>{text}</title>
      {label}
    </text>
  );
}
