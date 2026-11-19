import { describe, it, expect } from 'vitest';
import {
  CATEGORY_OPTIONS,
  CATEGORY_GROUPS,
  SEGMENTS,
  categoriesWithAll,
  categoryLabel,
  segmentOf,
  categoryValuesInSegment,
} from './categories';
import { Constants } from '@/integrations/supabase/types';

describe('categorias', () => {
  it('não repete valores', () => {
    const values = CATEGORY_OPTIONS.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('bate exatamente com o enum establishment_category do banco', () => {
    const doBanco = [...Constants.public.Enums.establishment_category].sort();
    const doCodigo = CATEGORY_OPTIONS.map((c) => c.value as string).sort();
    expect(doCodigo).toEqual(doBanco);
  });

  it('toda categoria pertence a um segmento existente', () => {
    const ids = new Set(SEGMENTS.map((s) => s.id));
    CATEGORY_OPTIONS.forEach((c) => expect(ids.has(c.segment)).toBe(true));
  });

  it('cobre comida, comércio e serviços', () => {
    expect(categoryValuesInSegment('alimentacao').length).toBeGreaterThan(5);
    expect(categoryValuesInSegment('comercio').length).toBeGreaterThan(5);
    expect(categoryValuesInSegment('servicos').length).toBeGreaterThan(5);
  });

  it('categoriesWithAll coloca "todos" no início sem alterar as demais', () => {
    const list = categoriesWithAll('Todas as categorias');
    expect(list[0]).toEqual({ value: 'todos', label: 'Todas as categorias' });
    expect(list).toHaveLength(CATEGORY_OPTIONS.length + 1);
  });

  it('categoryLabel e segmentOf', () => {
    expect(categoryLabel('salao_beleza')).toBe('Salão de Beleza');
    expect(categoryLabel('categoria-desconhecida')).toBe('categoria-desconhecida');
    expect(categoryLabel(null)).toBe('');
    expect(segmentOf('barbearia')).toBe('servicos');
    expect(segmentOf('pizzaria')).toBe('alimentacao');
    expect(segmentOf('xyz')).toBeNull();
  });

  it('grupos listam só segmentos com categorias', () => {
    CATEGORY_GROUPS.forEach((g) => expect(g.options.length).toBeGreaterThan(0));
  });
});
