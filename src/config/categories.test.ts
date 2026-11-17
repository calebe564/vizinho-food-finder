import { describe, it, expect } from 'vitest';
import { CATEGORY_OPTIONS, categoriesWithAll } from './categories';

describe('categorias', () => {
  it('não repete valores', () => {
    const values = CATEGORY_OPTIONS.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
  it('categoriesWithAll coloca "todos" no início sem alterar as demais', () => {
    const list = categoriesWithAll('Todas as categorias');
    expect(list[0]).toEqual({ value: 'todos', label: 'Todas as categorias' });
    expect(list).toHaveLength(CATEGORY_OPTIONS.length + 1);
  });
});
