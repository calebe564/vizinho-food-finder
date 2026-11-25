// @vitest-environment jsdom
// Teste de fumaça da página da empresa: monta a página inteira com um banco de mentira
// e confere o que a pessoa vê (capa, ficha, mapa, retirada, promoções, denúncia, dados para o Google).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, theme: null as null | Record<string, unknown> }));

// banco de mentira: .from(t).select().eq()... devolve as linhas da tabela, filtradas pelos .eq()
vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const filters: [string, unknown][] = [];
    const run = () => (db.tables[table] ?? []).filter((r) => filters.every(([k, v]) => r[k] === v));
    const b: Record<string, unknown> = {
      select: () => b,
      eq: (k: string, v: unknown) => { filters.push([k, v]); return b; },
      in: () => b,
      order: () => b,
      limit: () => b,
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      single: async () => ({ data: run()[0] ?? null, error: null }),
      then: (resolve: (v: unknown) => unknown) => resolve({ data: run(), error: null }),
    };
    return b;
  };
  return { supabase: { from: builder, rpc: vi.fn() } };
});
vi.mock('@/integrations/supabase/untyped', () => ({ supabaseUntyped: { rpc: vi.fn() } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => ({ isAdmin: false, isLoading: false }) }));
vi.mock('@/hooks/useFavorites', () => ({ useFavorites: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() }) }));
vi.mock('@/hooks/useEstablishmentPhotos', () => ({ useEstablishmentPhotos: () => ({ data: [] }) }));
vi.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => null }));
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'light' }) }));
vi.mock('@/hooks/usePlanConfig', async (orig) => ({
  ...(await orig<typeof import('@/hooks/usePlanConfig')>()),
  usePlanConfigs: () => ({ data: DEFAULT_CONFIGS }),
}));
vi.mock('@/hooks/useEstablishmentTheme', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useEstablishmentTheme')>()),
  useEstablishmentTheme: () => ({ data: db.theme }),
}));
vi.mock('@/components/ReviewSection', () => ({ ReviewSection: () => <div>avaliações</div> }));
vi.mock('@/components/ProductCard', () => ({
  ProductCard: (p: { name: string; isPromotion?: boolean }) => <div data-testid="produto">{p.name}{p.isPromotion ? ' (promo)' : ''}</div>,
}));

import { DEFAULT_CONFIGS } from '@/hooks/usePlanConfig';
import EstablishmentDetail from './EstablishmentDetail';

const ID = 'e-1';
const future = new Date(Date.now() + 5 * 864e5).toISOString();
const past = new Date(Date.now() - 5 * 864e5).toISOString();

const establishment = {
  id: ID, name: 'Padaria do Zé', active: true, category: 'padaria',
  address: 'Rua A, 10', neighborhood: 'Barreiro', city: 'Belo Horizonte', phone: '3133334444',
  whatsapp: '31999990000', schedule: 'Seg a Sáb 6h-20h', description: 'Pães feitos na hora.',
  latitude: -19.98, longitude: -44.03, google_maps_link: null, reference_point: 'Perto da praça',
  profile_image: null, banner_image: 'https://img.exemplo.com/capa.jpg', images: [],
  has_delivery: true, delivery_type: 'proprio', delivery_other: null, has_pickup: true,
  website: 'www.padariadoze.com.br', instagram: '@padariadoze', contact_email: 'contato@padariadoze.com.br',
  external_link: null, rating_average: 4.5, rating_count: 8, cnpj: null, plan: 'gratuito',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/estabelecimento/${ID}`]}>
          <Routes>
            <Route path="/estabelecimento/:id" element={<EstablishmentDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  db.theme = null;
  db.tables = {
    establishments: [establishment],
    products: [
      { id: 'p1', establishment_id: ID, name: 'Pão francês', price: 1, is_promotion: false },
      { id: 'p2', establishment_id: ID, name: 'Bolo de fubá', price: 20, is_promotion: true, promotion_description: 'Leve 2', promotion_expiration: future },
      { id: 'p3', establishment_id: ID, name: 'Torta vencida', price: 30, is_promotion: true, promotion_description: 'Antiga', promotion_expiration: past },
    ],
    product_variations: [],
  };
});
afterEach(() => cleanup());

describe('Página da empresa', () => {
  it('mostra a vitrine completa', async () => {
    renderPage();
    expect(await screen.findByText('Padaria do Zé')).toBeTruthy();

    // capa
    expect(screen.getByAltText('Capa de Padaria do Zé').getAttribute('src')).toBe('https://img.exemplo.com/capa.jpg');
    // contato e redes
    expect(screen.getByText('padariadoze.com.br')).toBeTruthy();
    expect(screen.getByText('@padariadoze')).toBeTruthy();
    expect(screen.getByText('contato@padariadoze.com.br')).toBeTruthy();
    // localização
    expect(screen.getByText('Referência: Perto da praça')).toBeTruthy();
    expect(screen.getByText('Como chegar')).toBeTruthy();
    // delivery e retirada
    expect(screen.getByText(/Retirada no local/)).toBeTruthy();
    expect(screen.getByText(/Delivery: Delivery Próprio/)).toBeTruthy();
  });

  it('promoções: só aparece a que está valendo', async () => {
    renderPage();
    await screen.findByText('Padaria do Zé');
    const promos = await screen.findByText(/Promoções \(1\)/);
    expect(promos).toBeTruthy();
    expect(screen.getAllByText('Bolo de fubá (promo)').length).toBeGreaterThan(0);
    expect(screen.queryByText('Torta vencida (promo)')).toBeNull();
  });

  it('o mapa só abre quando a pessoa pede', async () => {
    renderPage();
    await screen.findByText('Padaria do Zé');
    expect(document.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByText('Ver no mapa'));
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain('openstreetmap.org');
  });

  it('publica dados para o Google só com informações reais', async () => {
    renderPage();
    await screen.findByText('Padaria do Zé');
    await waitFor(() => expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull());
    const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld['@type']).toBe('LocalBusiness');
    expect(ld.name).toBe('Padaria do Zé');
    expect(ld.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 8 });
    expect(ld.geo.latitude).toBe(-19.98);
    await waitFor(() => expect(document.title).toContain('Padaria do Zé'));
  });

  it('empresa inexistente ou inativa não vaza nada', async () => {
    db.tables.establishments = [{ ...establishment, active: false }];
    renderPage();
    await waitFor(() => expect(screen.queryByText('Padaria do Zé')).toBeNull());
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('a denúncia abre pelo menu, sem exigir login', async () => {
    renderPage();
    await screen.findByText('Padaria do Zé');
    const trigger = document.querySelector('header button[aria-haspopup="menu"]') as HTMLElement;
    expect(trigger).not.toBeNull();
    // o menu (Radix) abre com Enter no botão; o clique do mouse depende de eventos que o jsdom não simula
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const item = await screen.findByText('Denunciar');
    fireEvent.click(item);
    expect(await screen.findByText('Denunciar empresa')).toBeTruthy();
  });

  describe('cores da empresa (personalização)', () => {
    const row = { establishment_id: ID, primary_color: '#DB2777', secondary_color: '#0EA5E9', corner_style: 'arredondado' };
    const main = () => document.querySelector('main') as HTMLElement;
    const withPlan = (plan: string) => { db.tables.establishments = [{ ...establishment, plan }]; };

    it('Max: aplica cor principal, secundária e cantos, só dentro de <main>', async () => {
      withPlan('max'); db.theme = row;
      renderPage();
      await screen.findByText('Padaria do Zé');
      expect(main().dataset.merchantTheme).toBe('on');
      const style = main().style;
      expect(style.getPropertyValue('--primary')).toMatch(/^\d+(\.\d)? \d+(\.\d)?% \d+(\.\d)?%$/);
      expect(style.getPropertyValue('--accent')).not.toBe('');
      expect(style.getPropertyValue('--radius')).toBe('1.5rem');
    });

    it('o cabeçalho do site e o resto da página NÃO recebem as cores', async () => {
      withPlan('max'); db.theme = row;
      renderPage();
      await screen.findByText('Padaria do Zé');
      document.querySelectorAll('header').forEach((h) => {
        expect((h as HTMLElement).style.getPropertyValue('--primary')).toBe('');
        expect(h.closest('main')).toBeNull();
      });
      expect(document.body.style.getPropertyValue('--primary')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--primary')).toBe('');
    });

    it('Pro: só a cor principal (secundária e cantos do tema salvo são ignorados)', async () => {
      withPlan('pro'); db.theme = row;
      renderPage();
      await screen.findByText('Padaria do Zé');
      expect(main().style.getPropertyValue('--primary')).not.toBe('');
      expect(main().style.getPropertyValue('--accent')).toBe('');
      expect(main().style.getPropertyValue('--radius')).toBe('');
    });

    it('plano sem personalização (ex.: rebaixado a Start): tema salvo é ignorado', async () => {
      withPlan('start'); db.theme = row;
      renderPage();
      await screen.findByText('Padaria do Zé');
      expect(main().dataset.merchantTheme).toBeUndefined();
      expect(main().style.getPropertyValue('--primary')).toBe('');
    });

    it('sem tema salvo: tema padrão do site', async () => {
      withPlan('max'); db.theme = null;
      renderPage();
      await screen.findByText('Padaria do Zé');
      expect(main().dataset.merchantTheme).toBeUndefined();
    });

    it('um valor malicioso salvo no lugar da cor não vira estilo', async () => {
      withPlan('max'); db.theme = { ...row, primary_color: '#fff; background:url(http://x)', secondary_color: 'red', corner_style: 'padrao' };
      renderPage();
      await screen.findByText('Padaria do Zé');
      expect(main().dataset.merchantTheme).toBeUndefined();
      expect(main().getAttribute('style') ?? '').not.toMatch(/url|http/);
    });
  });
});
