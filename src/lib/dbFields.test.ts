import { describe, it, expect } from 'vitest';
import { ratingOf, promoOf } from './dbFields';

describe('ratingOf', () => {
  it('lê nota e quantidade, com zero como padrão', () => {
    expect(ratingOf({ rating_average: 4.5, rating_count: 10 })).toEqual({ average: 4.5, count: 10 });
    expect(ratingOf({})).toEqual({ average: 0, count: 0 });
    expect(ratingOf(null)).toEqual({ average: 0, count: 0 });
    expect(ratingOf(undefined)).toEqual({ average: 0, count: 0 });
  });
});

describe('promoOf', () => {
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const future = new Date(Date.now() + 86_400_000).toISOString();

  it('promoção dentro da validade está ativa', () => {
    const p = promoOf({ is_promotion: true, promotion_description: 'Leve 2', promotion_expiration: future });
    expect(p.isActive).toBe(true);
    expect(p.expired).toBe(false);
    expect(p.description).toBe('Leve 2');
  });
  it('promoção vencida é marcada como expirada', () => {
    const p = promoOf({ is_promotion: true, promotion_expiration: past });
    expect(p.expired).toBe(true);
    expect(p.isActive).toBe(false);
  });
  it('sem promoção, nada fica ativo', () => {
    expect(promoOf({}).isActive).toBe(false);
    expect(promoOf(null).isPromotion).toBe(false);
  });
});
