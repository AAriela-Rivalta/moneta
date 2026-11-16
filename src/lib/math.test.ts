import { describe, expect, it } from 'vitest';
import { average, median, percentChange, percentOf, roundMoney, roundUpNice, standardDeviation } from './math';

describe('percentOf', () => {
  it('calcula el porcentaje que representa una parte del total', () => {
    expect(percentOf(25, 200)).toBe(12.5);
  });

  it('devuelve 0 si el total es 0 (evita dividir por cero)', () => {
    expect(percentOf(10, 0)).toBe(0);
  });
});

describe('percentChange', () => {
  it('calcula aumentos y disminuciones', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });

  it('mide la mejora de un valor negativo respecto de su magnitud', () => {
    // Pasar de -100 a -50 es una mejora del 50%.
    expect(percentChange(-50, -100)).toBe(50);
  });

  it('devuelve null cuando no hay base de comparación', () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
  });
});

describe('estadística básica', () => {
  it('average, median y standardDeviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(average(values)).toBe(5);
    expect(standardDeviation(values)).toBe(2);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('devuelve 0 con listas vacías', () => {
    expect(average([])).toBe(0);
    expect(median([])).toBe(0);
    expect(standardDeviation([7])).toBe(0);
  });
});

describe('roundMoney', () => {
  it('redondea a 2 decimales', () => {
    expect(roundMoney(1.234)).toBe(1.23);
    expect(roundMoney(1.236)).toBe(1.24);
  });
});

describe('roundUpNice', () => {
  it('redondea hacia arriba con un paso según la magnitud', () => {
    expect(roundUpNice(120)).toBe(150);
    expect(roundUpNice(1_001)).toBe(1_500);
    expect(roundUpNice(12_300)).toBe(13_000);
    expect(roundUpNice(230_001)).toBe(235_000);
  });

  it('devuelve 0 para valores no positivos', () => {
    expect(roundUpNice(0)).toBe(0);
    expect(roundUpNice(-50)).toBe(0);
  });
});
