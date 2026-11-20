// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({ tables: {} as Record<string, Row[]> }));

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const filters: [string, unknown][] = [];
    const run = () => (db.tables[table] ?? []).filter((r) => filters.every(([k, v]) => r[k] === v));
    const b: Record<string, unknown> = {
      select: () => b,
      eq: (k: string, v: unknown) => { filters.push([k, v]); return b; },
      in: () => b,
      order: () => b,
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      then: (resolve: (v: unknown) => unknown) => resolve({ data: run(), error: null }),
    };
    return b;
  };
  return { supabase: { from: builder } };
});
vi.mock('@/integrations/supabase/untyped', () => ({ supabaseUntyped: { rpc: vi.fn() } }));
vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ isProductFavorite: () => false, toggleProductFavorite: vi.fn() }),
}));
vi.mock('@/components/Header', () => ({ Header: () => <header /> }));
vi.mock('@/components/Footer', () => ({ Footer: () => <footer /> }));

import ProductDetail from './ProductDetail';

beforeEach(() => {
  db.tables = {
    products: [{ id: 'p1', establishment_id: 'e1', name: 'Pizza Calabresa', price: 45.9, description: 'Boa', images: [], image: null }],
    product_variations: [],
    establishments: [{
      id: 'e1', name: 'Pizzaria do Zé', active: true, phone: '3133334444', whatsapp: null, address: 'Rua A',
      neighborhood: 'Barreiro', city: 'Belo Horizonte', schedule: 'Todos os dias 18h-23h', has_delivery: true,
      profile_image: null,
    }],
  };
});
afterEach(() => cleanup());

describe('Página do produto', () => {
  it('mostra o botão de denúncia e abre o formulário para este produto', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <HelmetProvider>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/produto/p1']}>
            <Routes>
              <Route path="/produto/:id" element={<ProductDetail />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
    expect((await screen.findAllByText('Pizza Calabresa')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('Denunciar este produto'));
    expect(await screen.findByText('Denunciar produto')).toBeTruthy();
  });
});
