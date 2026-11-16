export function sumBy<T>(items: readonly T[], getValue: (item: T) => number): number {
  let total = 0;
  for (const item of items) total += getValue(item);
  return total;
}

export function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Porcentaje que representa `part` sobre `total`. Devuelve 0 si el total es 0. */
export function percentOf(part: number, total: number): number {
  return total === 0 ? 0 : (part / total) * 100;
}

/**
 * Variación porcentual entre dos valores.
 * Devuelve `null` cuando no hay base de comparación (anterior = 0 y actual ≠ 0).
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Redondea hacia arriba a un número "amigable" según su magnitud (para sugerencias de montos). */
export function roundUpNice(value: number): number {
  if (value <= 0) return 0;
  const step = value < 1_000 ? 50 : value < 10_000 ? 500 : value < 100_000 ? 1_000 : value < 1_000_000 ? 5_000 : 50_000;
  return Math.ceil(value / step) * step;
}
