// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { MerchantProduct, ProductFormValues } from '@/lib/products';

type Call = { table: string; op: string; args: unknown[] };
const calls = vi.hoisted(() => ({ list: [] as { table: string; op: string; args: unknown[] }[], results: {} as Record<string, { data?: unknown; error?: unknown }> }));

// banco de mentira que anota cada chamada e devolve o resultado combinado por "tabela.operação"
vi.mock('@/integrations/supabase/untyped', () => {
  const from = (table: string) => {
    let op = '';
    const finish = () => calls.results[`${table}.${op}`] ?? { data: null, error: null };
    const b: Record<string, unknown> = {
      select: (...a: unknown[]) => { if (!op) op = 'select'; calls.list.push({ table, op: 'select', args: a }); return b; },
      insert: (...a: unknown[]) => { op = 'insert'; calls.list.push({ table, op, args: a }); return b; },
      update: (...a: unknown[]) => { op = 'update'; calls.list.push({ table, op, args: a }); return b; },
      delete: (...a: unknown[]) => { op = 'delete'; calls.list.push({ table, op, args: a }); return b; },
      eq: (...a: unknown[]) => { calls.list.push({ table, op: 'eq', args: a }); return b; },
      in: (...a: unknown[]) => { calls.list.push({ table, op: 'in', args: a }); return b; },
      single: async () => finish(),
      then: (resolve: (v: unknown) => unknown) => resolve(finish()),
    };
    return b;
  };
  return { supabaseUntyped: { from } };
});

import { productErrorMessage, useSaveProduct, useDeleteProduct } from './useMerchantProducts';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>
);
const ops = (c: Call[]) => c.filter((x) => ['insert', 'update', 'delete'].includes(x.op)).map((x) => `${x.table}.${x.op}`);

const values = (extra: Partial<ProductFormValues> = {}): ProductFormValues => ({
  name: ' Pizza ', description: ' Boa ', category: ' Pizzas ', price: 0, is_available: true, hasVariations: true,
  variations: [{ name: ' Média ', price: 8 }, { name: 'Grande', price: 12 }], ...extra,
});
const existing = (): MerchantProduct => ({
  id: 'p1', name: 'Pizza', description: null, price: 9, image: null, unit: null, category: null, is_available: true,
  is_promotion: false, promotion_description: null, promotion_expiration: null, created_at: null,
  product_variations: [{ id: 'old1', name: 'Antiga', price: 9 }],
});

beforeEach(() => { calls.list = []; calls.results = {}; });

describe('productErrorMessage', () => {
  it('repassa a mensagem do limite do plano e esconde erros técnicos', () => {
    expect(productErrorMessage({ message: 'Limite de 15 produtos do plano atual atingido. Escolha um plano maior.' }, 'x')).toMatch(/^Limite de 15/);
    expect(productErrorMessage({ code: '42501', message: 'new row violates row-level security policy' }, 'x')).toMatch(/permissão/);
    expect(productErrorMessage({ message: 'relation "x" does not exist' }, 'Falhou')).toBe('Falhou');
    expect(productErrorMessage(null, 'Falhou')).toBe('Falhou');
  });
});

describe('useSaveProduct', () => {
  it('cadastra produto novo: grava o produto e depois as variações, com preço "a partir de"', async () => {
    calls.results['products.insert'] = { data: { id: 'novo1' }, error: null };
    const { result } = renderHook(() => useSaveProduct('e1'), { wrapper });
    await act(async () => { await result.current.mutateAsync({ values: values(), imageUrl: 'https://img/p.jpg' }); });

    const insertProduct = calls.list.find((c) => c.table === 'products' && c.op === 'insert')!;
    expect(insertProduct.args[0]).toMatchObject({
      name: 'Pizza', description: 'Boa', category: 'Pizzas', price: 8, image: 'https://img/p.jpg', is_available: true, establishment_id: 'e1',
    });
    const insertVariations = calls.list.find((c) => c.table === 'product_variations' && c.op === 'insert')!;
    expect(insertVariations.args[0]).toEqual([
      { product_id: 'novo1', name: 'Média', price: 8 },
      { product_id: 'novo1', name: 'Grande', price: 12 },
    ]);
    expect(ops(calls.list)).toEqual(['products.insert', 'product_variations.insert']);
  });

  it('editar: grava as variações novas ANTES de apagar as antigas (nunca perde dados se algo falhar)', async () => {
    const { result } = renderHook(() => useSaveProduct('e1'), { wrapper });
    await act(async () => { await result.current.mutateAsync({ values: values(), imageUrl: null, existing: existing() }); });
    expect(ops(calls.list)).toEqual(['products.update', 'product_variations.insert', 'product_variations.delete']);
    expect(calls.list.find((c) => c.op === 'in')?.args).toEqual(['id', ['old1']]);
  });

  it('se gravar as variações falhar, as antigas NÃO são apagadas', async () => {
    calls.results['product_variations.insert'] = { error: { message: 'falhou' } };
    const { result } = renderHook(() => useSaveProduct('e1'), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ values: values(), imageUrl: null, existing: existing() })).rejects.toThrow(/variações não/);
    });
    expect(ops(calls.list)).not.toContain('product_variations.delete');
  });

  it('produto sem variações: apaga as antigas e não insere nenhuma', async () => {
    const { result } = renderHook(() => useSaveProduct('e1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ values: values({ hasVariations: false, variations: [], price: 10 }), imageUrl: null, existing: existing() });
    });
    expect(ops(calls.list)).toEqual(['products.update', 'product_variations.delete']);
    expect(calls.list.find((c) => c.table === 'products' && c.op === 'update')!.args[0]).toMatchObject({ price: 10 });
  });

  it('limite do plano: a mensagem do banco chega pronta à pessoa e nada mais é gravado', async () => {
    calls.results['products.insert'] = { error: { code: '23514', message: 'Limite de 15 produtos do plano atual atingido. Escolha um plano maior para cadastrar mais.' } };
    const { result } = renderHook(() => useSaveProduct('e1'), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ values: values({ hasVariations: false, price: 5 }), imageUrl: null })).rejects.toThrow(/^Limite de 15 produtos/);
    });
    expect(ops(calls.list)).toEqual(['products.insert']);
  });

  it('sem empresa escolhida, recusa', async () => {
    const { result } = renderHook(() => useSaveProduct(undefined), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ values: values(), imageUrl: null })).rejects.toThrow(/Selecione uma empresa/);
    });
    expect(calls.list).toHaveLength(0);
  });
});

describe('useDeleteProduct', () => {
  it('apaga as variações e depois o produto', async () => {
    const { result } = renderHook(() => useDeleteProduct('e1'), { wrapper });
    await act(async () => { await result.current.mutateAsync('p1'); });
    expect(ops(calls.list)).toEqual(['product_variations.delete', 'products.delete']);
  });
  it('se o produto não puder ser apagado, avisa', async () => {
    calls.results['products.delete'] = { error: { code: '42501', message: 'row-level security' } };
    const { result } = renderHook(() => useDeleteProduct('e1'), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync('p1')).rejects.toThrow(/permissão/);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
