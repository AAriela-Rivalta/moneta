/**
 * Colores de identidad para categorías y objetivos.
 * Los primeros 8 forman una paleta categórica validada para daltonismo (orden fijo).
 * El color se guarda en cada entidad: nunca se reasigna según el ranking.
 */
export const ENTITY_COLORS = [
  '#2a78d6', // azul
  '#eb6834', // naranja
  '#1baf7a', // aqua
  '#eda100', // amarillo
  '#e87ba4', // magenta
  '#008300', // verde
  '#6250d6', // violeta
  '#e34948', // rojo
  '#0e7490', // petróleo
  '#9a6b3f', // marrón
  '#475569', // pizarra
  '#a3a9b1', // gris
] as const;

/** Colores semánticos de los gráficos (coinciden con los tokens del tema). */
export const CHART_COLORS = {
  income: '#2f97cf',
  expense: '#ec5f47',
  balance: '#1f78ad',
  neutral: '#b9bec5',
  other: '#c7ccd2',
  grid: '#ece6da',
  axis: '#8d949d',
  cursor: 'rgba(47, 151, 207, 0.08)',
} as const;
