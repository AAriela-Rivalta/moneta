import { describe, expect, it } from 'vitest';
import { formatCurrency, formatPercent } from './format';

/** Intl usa espacios no separables: se normalizan para comparar texto plano. */
const plain = (value: string) => value.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('usa el formato argentino de miles y decimales', () => {
    expect(plain(formatCurrency(15000, 'ARS'))).toBe('$ 15.000');
    expect(plain(formatCurrency(1500.5, 'ARS'))).toBe('$ 1.500,50');
  });

  it('distingue el dólar del peso (US$ vs. $)', () => {
    expect(formatCurrency(1500, 'USD')).toContain('US$');
    expect(formatCurrency(1500, 'ARS')).not.toContain('US');
  });

  it('muestra el signo cuando se pide', () => {
    expect(plain(formatCurrency(2500, 'ARS', { signed: true }))).toBe('+$ 2.500');
  });

  it('trata valores no numéricos como 0', () => {
    expect(plain(formatCurrency(Number.NaN, 'ARS'))).toBe('$ 0');
  });
});

describe('formatPercent', () => {
  it('formatea con coma decimal y signo opcional', () => {
    expect(formatPercent(23.5, 1)).toBe('23,5%');
    expect(formatPercent(12, 0, true)).toBe('+12%');
  });
});
