import { describe, expect, it } from 'vitest';
import { SYSTEM_CATEGORY } from '@/config/constants';
import { expense, income } from '@/test/factories';
import { amountToField, parseReceiptText, suggestCategoryId } from './receipt';

const TICKET = `SUPERMERCADO DIA
CUIT 30-12345678-9
12/11/2026
Leche          450,00
Pan            200,00
SUBTOTAL     1.000,00
TOTAL        2.300,00`;

describe('parseReceiptText', () => {
  it('lee comercio, total y fecha de un ticket típico', () => {
    const draft = parseReceiptText(TICKET);

    expect(draft.merchant).toBe('SUPERMERCADO DIA');
    expect(draft.amount).toBe(2300);
    expect(draft.date).toBe('2026-11-12');
  });

  it('prioriza el total aunque haya un número más grande en otra línea', () => {
    const draft = parseReceiptText('Kiosco Centro\nPUNTOS 999999\nTOTAL 100,00');

    expect(draft.merchant).toBe('Kiosco Centro');
    expect(draft.amount).toBe(100);
  });

  it('sin total, elige el mayor monto y no usa el CUIT ni un número de comprobante', () => {
    const draft = parseReceiptText('Almacen Norte\nCUIT 30123456789\nNro 00012345\nGaseosa 800,00\nAlfajor 1.500,00');

    expect(draft.amount).toBe(1500);
    expect(draft.merchant).toBe('Almacen Norte');
  });

  it('interpreta una fecha corta y descarta una fecha imposible', () => {
    expect(parseReceiptText('1/3/26\nVerduleria\nTOTAL 50,00').date).toBe('2026-03-01');
    expect(parseReceiptText('32/13/2026\nVerduleria\nTOTAL 50,00').date).toBeNull();
    expect(parseReceiptText('32/13/2026\n01/03/2026\nVerduleria').date).toBe('2026-03-01');
  });

  it('no confunde un importe con una fecha y saltea el encabezado fiscal', () => {
    const draft = parseReceiptText('TICKET FISCAL\nSUPERMERCADO DIA\nTOTAL 2.300,00');

    expect(draft.merchant).toBe('SUPERMERCADO DIA');
    expect(draft.amount).toBe(2300);
    expect(draft.date).toBeNull();
  });

  it('devuelve vacío cuando el texto no tiene datos útiles', () => {
    expect(parseReceiptText('')).toEqual({ merchant: null, amount: null, date: null });
    expect(parseReceiptText('@@@@')).toEqual({ merchant: null, amount: null, date: null });
  });
});

describe('amountToField', () => {
  it('usa coma decimal solo cuando hay centavos', () => {
    expect(amountToField(2300)).toBe('2300');
    expect(amountToField(2300.5)).toBe('2300,50');
    expect(amountToField(15.5)).toBe('15,50');
  });
});

describe('suggestCategoryId', () => {
  it('sugiere la categoría del gasto que comparte una palabra con el comercio', () => {
    const transactions = [
      expense(100, '2026-11-02', { description: 'Supermercado Dia', categoryId: 'exp-supermercado' }),
      expense(80, '2026-11-03', { description: 'Supermercado Dia sucursal', categoryId: 'exp-supermercado' }),
      expense(40, '2026-11-04', { description: 'Supermercado del centro', categoryId: 'exp-otros' }),
      income(90_000, '2026-11-01', { description: 'Supermercado' }),
    ];

    expect(suggestCategoryId('SUPERMERCADO DIA', transactions)).toBe('exp-supermercado');
  });

  it('no sugiere si hay empate, si el comercio es muy corto o si solo coincide con ahorro', () => {
    const tied = [
      expense(100, '2026-11-02', { description: 'Supermercado Dia', categoryId: 'exp-supermercado' }),
      expense(80, '2026-11-03', { description: 'Supermercado extra', categoryId: 'exp-otros' }),
    ];
    expect(suggestCategoryId('SUPERMERCADO DIA', tied)).toBeNull();
    expect(suggestCategoryId('Dia', tied)).toBeNull();
    expect(
      suggestCategoryId('Supermercado Dia', [
        expense(100, '2026-11-02', { description: 'Supermercado Dia', categoryId: SYSTEM_CATEGORY.savings }),
      ]),
    ).toBeNull();
  });
});
