import { describe, it, expect } from 'vitest';
import { DEFAULT_PLANS, formatBRL, sellablePlans, productLimitLabel, productsRemaining, isAtProductLimit } from './plans';

describe('planos padrão', () => {
  it('têm os preços e limites definidos pelo negócio', () => {
    const byName = Object.fromEntries(DEFAULT_PLANS.map((p) => [p.plan_name, p]));
    expect([byName.start.price_cents, byName.start.max_products]).toEqual([2490, 15]);
    expect([byName.pro.price_cents, byName.pro.max_products]).toEqual([3790, 30]);
    expect([byName.max.price_cents, byName.max.max_products]).toEqual([5370, 50]);
  });
  it('só Start, Pro e Max são vendidos, nessa ordem', () => {
    expect(sellablePlans(DEFAULT_PLANS).map((p) => p.plan_name)).toEqual(['start', 'pro', 'max']);
  });
  it('não prometem resultado (sem palavras como "garantido")', () => {
    const texto = DEFAULT_PLANS.flatMap((p) => [p.description, ...p.benefits]).join(' ').toLowerCase();
    expect(texto).not.toMatch(/garant|mais vendas|aumente suas vendas|resultado/);
  });
});

describe('formatBRL', () => {
  it('formata em reais', () => {
    expect(formatBRL(2490).replace(/\s/g, ' ')).toBe('R$ 24,90');
    expect(formatBRL(1500).replace(/\s/g, ' ')).toBe('R$ 15,00');
  });
});

describe('limite de produtos', () => {
  it('calcula restantes e bloqueio', () => {
    expect(productsRemaining(15, 10)).toBe(5);
    expect(productsRemaining(15, 20)).toBe(0);
    expect(productsRemaining(-1, 999)).toBeNull();
    expect(isAtProductLimit(15, 15)).toBe(true);
    expect(isAtProductLimit(15, 14)).toBe(false);
    expect(isAtProductLimit(-1, 999)).toBe(false);
    expect(productLimitLabel(-1)).toBe('ilimitados');
    expect(productLimitLabel(30)).toBe('30');
  });
});

import { parsePriceToCents, parseBenefits, centsToInput } from './plans';

describe('edição de preço e benefícios (painel do administrador)', () => {
  it('converte texto em centavos', () => {
    expect(parsePriceToCents('24,90')).toBe(2490);
    expect(parsePriceToCents('R$ 37,90')).toBe(3790);
    expect(parsePriceToCents('53.70')).toBe(5370);
    expect(parsePriceToCents('1.234,50')).toBe(123450);
    expect(parsePriceToCents('15')).toBe(1500);
    expect(parsePriceToCents('0')).toBe(0);
  });
  it('rejeita valor inválido', () => {
    expect(parsePriceToCents('')).toBeNull();
    expect(parsePriceToCents('abc')).toBeNull();
    expect(parsePriceToCents('-5')).toBe(500); // sinal é descartado: nunca negativo
    expect(parsePriceToCents('9999999')).toBeNull();
  });
  it('centsToInput é o inverso', () => {
    expect(centsToInput(2490)).toBe('24,90');
    expect(parsePriceToCents(centsToInput(5370))).toBe(5370);
  });
  it('benefícios: uma linha cada, sem vazias e com limite', () => {
    expect(parseBenefits('A\n\n  B  \n')).toEqual(['A', 'B']);
    expect(parseBenefits(Array.from({ length: 30 }, (_, i) => `b${i}`).join('\n'))).toHaveLength(15);
    expect(parseBenefits('x'.repeat(300))[0]).toHaveLength(120);
  });
});
