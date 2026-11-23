import { describe, it, expect } from 'vitest';
import { barHeights, otherClicks, totalOf, type MerchantMetrics } from './useMerchantMetrics';

const base: MerchantMetrics = {
  days: 30, since: '2026-10-01T00:00:00Z', first_event_at: '2026-10-05T10:00:00Z',
  totals: { profile_view: 10, whatsapp_click: 3, phone_click: 1, site_click: 2, directions_click: 4 },
  unique_visitors: 6, daily: [], top_products: [],
};

describe('totalOf / otherClicks', () => {
  it('lê o total do tipo, e zero quando o tipo não apareceu', () => {
    expect(totalOf(base, 'profile_view')).toBe(10);
    expect(totalOf(base, 'product_view')).toBe(0);
  });
  it('soma só os contatos que não são WhatsApp', () => {
    expect(otherClicks(base)).toBe(7); // 1 + 2 + 0 + 4
    expect(otherClicks({ ...base, totals: {} })).toBe(0);
  });
});

describe('barHeights', () => {
  it('escala pelo maior dia, com altura mínima para dias com visita', () => {
    expect(barHeights([0, 5, 10])).toEqual([0, 50, 100]);
    expect(barHeights([1, 100])).toEqual([4, 100]);
  });
  it('tudo zero fica zero (nada de barra inventada)', () => {
    expect(barHeights([0, 0, 0])).toEqual([0, 0, 0]);
    expect(barHeights([])).toEqual([]);
  });
});
