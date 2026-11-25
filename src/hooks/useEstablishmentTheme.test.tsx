// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const calls = vi.hoisted(() => ({ upsert: [] as unknown[][], del: [] as unknown[][], result: { error: null } as { error: unknown } }));
vi.mock('@/integrations/supabase/untyped', () => ({
  supabaseUntyped: {
    from: () => ({
      upsert: (...a: unknown[]) => { calls.upsert.push(a); return Promise.resolve(calls.result); },
      delete: () => ({ eq: (...a: unknown[]) => { calls.del.push(a); return Promise.resolve(calls.result); } }),
    }),
  },
}));

import { themeErrorMessage, toThemeInput, useResetTheme, useSaveTheme } from './useEstablishmentTheme';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>
);

beforeEach(() => { calls.upsert = []; calls.del = []; calls.result = { error: null }; });

describe('toThemeInput', () => {
  it('converte a linha do banco e trata ausência', () => {
    expect(toThemeInput({ establishment_id: 'e', primary_color: '#111111', secondary_color: null, corner_style: 'reto' })).toEqual({ primary: '#111111', secondary: null, radius: 'reto' });
    expect(toThemeInput(null)).toEqual({ primary: null, secondary: null, radius: null });
  });
});

describe('themeErrorMessage', () => {
  it('repassa as mensagens do plano e esconde as técnicas', () => {
    expect(themeErrorMessage({ message: 'O plano atual não inclui personalização visual. Veja os planos Pro e Max.' })).toMatch(/não inclui personalização/);
    expect(themeErrorMessage({ message: 'A cor secundária e o estilo dos cantos fazem parte do plano Max.' })).toMatch(/plano Max/);
    expect(themeErrorMessage({ message: 'violates check constraint' })).toBe('Não foi possível salvar a aparência agora. Tente novamente.');
  });
});

describe('useSaveTheme', () => {
  it('grava em maiúsculas, por empresa, e aceita cor secundária vazia', async () => {
    const { result } = renderHook(() => useSaveTheme('e1'), { wrapper });
    await act(async () => { await result.current.mutateAsync({ primary: '#db2777', secondary: null, corner: 'padrao' }); });
    expect(calls.upsert[0][0]).toEqual({ establishment_id: 'e1', primary_color: '#DB2777', secondary_color: null, corner_style: 'padrao' });
    expect(calls.upsert[0][1]).toEqual({ onConflict: 'establishment_id' });
  });
  it('nem chega ao banco com cor inválida', async () => {
    const { result } = renderHook(() => useSaveTheme('e1'), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ primary: 'red', secondary: null, corner: 'padrao' })).rejects.toThrow(/Cor principal inválida/);
      await expect(result.current.mutateAsync({ primary: '#111111', secondary: '#12', corner: 'padrao' })).rejects.toThrow(/Cor secundária inválida/);
    });
    expect(calls.upsert).toHaveLength(0);
  });
  it('mostra a recusa do plano', async () => {
    calls.result = { error: { message: 'O plano atual não inclui personalização visual. Veja os planos Pro e Max.' } };
    const { result } = renderHook(() => useSaveTheme('e1'), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ primary: '#111111', secondary: null, corner: 'padrao' })).rejects.toThrow(/não inclui personalização/);
    });
  });
});

describe('useResetTheme', () => {
  it('apaga o tema da empresa', async () => {
    const { result } = renderHook(() => useResetTheme('e1'), { wrapper });
    await act(async () => { await result.current.mutateAsync(); });
    expect(calls.del[0]).toEqual(['establishment_id', 'e1']);
  });
});
