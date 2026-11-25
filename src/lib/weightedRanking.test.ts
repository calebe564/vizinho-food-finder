import { describe, it, expect, vi, afterEach } from 'vitest';
import { applyWeightedRanking, selectHighlights, type WeightedItem } from './weightedRanking';

const make = (n: number, plan: (i: number) => string): WeightedItem[] =>
  Array.from({ length: n }, (_, i) => ({ id: `e${i}`, plan: plan(i), is_promotion: i % 2 === 0 }));

afterEach(() => vi.useRealTimers());

describe('rodízio justo: plano e promoção não dão vantagem', () => {
  it('quem paga mais NÃO aparece mais vezes em primeiro lugar', () => {
    const items = make(3, (i) => ['gratuito', 'start', 'max'][i]);
    const firstCounts: Record<string, number> = { e0: 0, e1: 0, e2: 0 };

    // varre muitas "janelas de 5 minutos" (o sorteio muda a cada janela)
    vi.useFakeTimers();
    const windows = 3000;
    for (let w = 0; w < windows; w++) {
      vi.setSystemTime(w * 5 * 60 * 1000 + 1);
      firstCounts[applyWeightedRanking(items)[0].id]++;
    }

    // com pesos iguais cada um fica perto de 1/3 (1000 de 3000)
    for (const id of Object.keys(firstCounts)) {
      expect(firstCounts[id]).toBeGreaterThan(windows * 0.28);
      expect(firstCounts[id]).toBeLessThan(windows * 0.38);
    }
  });

  it('pesos enviados pelo banco são ignorados', () => {
    const items = make(2, (i) => ['gratuito', 'max'][i]);
    vi.useFakeTimers();
    let maxFirst = 0;
    const windows = 2000;
    for (let w = 0; w < windows; w++) {
      vi.setSystemTime(w * 5 * 60 * 1000 + 1);
      const out = applyWeightedRanking(items, [
        { plan_name: 'max', visibility_weight: 1000, promotion_boost: 50 },
        { plan_name: 'gratuito', visibility_weight: 1, promotion_boost: 1 },
      ]);
      if (out[0].id === 'e1') maxFirst++;
    }
    expect(maxFirst).toBeGreaterThan(windows * 0.43);
    expect(maxFirst).toBeLessThan(windows * 0.57);
  });

  it('não perde nem repete itens e respeita os grupos de prioridade', () => {
    const items = make(6, () => 'start');
    const out = applyWeightedRanking(items, undefined, (item) => (Number(item.id.slice(1)) < 3 ? 'a' : 'b'));
    expect(out.map((i) => i.id).sort()).toEqual(items.map((i) => i.id).sort());
    expect(out.slice(0, 3).every((i) => Number(i.id.slice(1)) < 3)).toBe(true);
  });

  it('selectHighlights devolve itens sem favorecer plano', () => {
    const items = make(5, (i) => (i === 0 ? 'max' : 'gratuito'));
    const out = selectHighlights(items, 3, 5);
    expect(out).toHaveLength(5);
  });
});
