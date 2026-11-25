// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_CONFIGS } from '@/hooks/usePlanConfig';
import type { MerchantMetrics } from '@/hooks/useMerchantMetrics';

const state = vi.hoisted(() => ({
  metrics: null as unknown,
  metricsLoading: false,
  products: [] as unknown[],
  subs: [] as unknown[],
  active: { establishment_id: 'e1', establishment: { name: 'Padaria do Zé' } } as unknown,
  plan: 'start',
  period: 0,
}));

vi.mock('@/components/Header', () => ({ Header: () => <header /> }));
vi.mock('@/components/EstablishmentSelector', () => ({ EstablishmentSelector: () => null }));
vi.mock('@/contexts/ActiveEstablishmentContext', () => ({
  useActiveEstablishment: () => ({ activeEstablishment: state.active, count: 1, isLoading: false }),
}));
vi.mock('@/hooks/useMerchantMetrics', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useMerchantMetrics')>()),
  useMerchantMetrics: (_id: string, days: number) => { state.period = days; return { data: state.metrics, isLoading: state.metricsLoading }; },
}));
vi.mock('@/hooks/useMerchantProducts', () => ({ useMerchantProducts: () => ({ data: state.products }) }));
vi.mock('@/hooks/useSubscriptions', () => ({ useEstablishmentSubscriptions: () => ({ data: state.subs }) }));
vi.mock('@/hooks/usePlanConfig', async (orig) => ({
  ...(await orig<typeof import('@/hooks/usePlanConfig')>()),
  usePlanConfigs: () => ({ data: DEFAULT_CONFIGS }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan: state.plan } }) }) }) }) },
}));

import MerchantDashboard from './MerchantDashboard';

const future = new Date(Date.now() + 5 * 864e5).toISOString();
const metrics: MerchantMetrics = {
  days: 30, since: '2026-10-01T00:00:00Z', first_event_at: '2026-10-05T10:00:00Z',
  totals: { profile_view: 120, product_view: 45, whatsapp_click: 18, phone_click: 2, directions_click: 5 },
  unique_visitors: 80,
  daily: [{ day: '2026-11-01', profile_view: 4, whatsapp_click: 1 }, { day: '2026-11-02', profile_view: 0, whatsapp_click: 0 }],
  top_products: [{ id: 'p1', name: 'Bolo de fubá', views: 12 }],
};
const product = (i: number, extra: Record<string, unknown> = {}) => ({
  id: `p${i}`, name: `P${i}`, price: 1, is_available: true, is_promotion: false, promotion_expiration: null, ...extra,
});

function renderIt() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <MerchantDashboard />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

beforeEach(() => { state.metrics = metrics; state.metricsLoading = false; state.products = []; state.subs = []; state.plan = 'start'; });
afterEach(() => cleanup());

describe('Painel: visão geral', () => {
  it('mostra os números reais do servidor', async () => {
    renderIt();
    expect(await screen.findByLabelText('Visitas ao perfil: 120')).toBeTruthy();
    expect(screen.getByLabelText('Visualizações de produtos: 45')).toBeTruthy();
    expect(screen.getByLabelText('Cliques no WhatsApp: 18')).toBeTruthy();
    expect(screen.getByLabelText('Outros contatos: 7')).toBeTruthy();
    expect(screen.getByText(/80 visitante\(s\) diferente\(s\)/)).toBeTruthy();
    expect(screen.getByText('1. Bolo de fubá')).toBeTruthy();
  });

  it('se o servidor não responde, mostra "indisponível" e NUNCA zero', async () => {
    state.metrics = null;
    renderIt();
    expect(await screen.findByLabelText('Visitas ao perfil: indisponível')).toBeTruthy();
    expect(screen.getByText(/estatísticas estão indisponíveis/)).toBeTruthy();
    expect(screen.queryByLabelText('Visitas ao perfil: 0')).toBeNull();
  });

  it('sem nenhum evento ainda: explica, sem gráfico e sem inventar histórico', async () => {
    state.metrics = { ...metrics, first_event_at: null, totals: {}, unique_visitors: 0, daily: [], top_products: [] };
    renderIt();
    expect(await screen.findByText(/Ainda não há visitas registradas/)).toBeTruthy();
    expect(screen.getByLabelText('Visitas ao perfil: 0')).toBeTruthy();
    expect(screen.queryByText('Visitas por dia')).toBeNull();
  });

  it('diz desde quando contamos e as regras da contagem', async () => {
    renderIt();
    expect(await screen.findByText(/Contamos desde 05\/10\/2026/)).toBeTruthy();
    expect(screen.getByText(/suas próprias visitas e as da equipe não entram/)).toBeTruthy();
  });

  it('o período muda a consulta (7, 30 ou 90 dias)', async () => {
    renderIt();
    await screen.findByLabelText('Visitas ao perfil: 120');
    expect(state.period).toBe(30);
    fireEvent.click(screen.getByText('7 dias'));
    expect(state.period).toBe(7);
    fireEvent.click(screen.getByText('90 dias'));
    expect(state.period).toBe(90);
  });

  it('situação: produtos usados e limite, promoções ativas e plano', async () => {
    state.products = [product(1), product(2, { is_available: false }), product(3, { is_promotion: true, promotion_expiration: future }),
      product(4, { is_promotion: true, promotion_expiration: new Date(Date.now() - 864e5).toISOString() })];
    state.subs = [{ id: 's1', status: 'active', price_cents: 1500, promo_ends_at: future, plan_name: 'start' }];
    renderIt();
    expect(await screen.findByText(/11 ainda podem ser cadastrados/)).toBeTruthy(); // 4 de 15
    expect(screen.getByText(/1 indisponível\(is\)/)).toBeTruthy();
    expect(screen.getByLabelText('Promoções ativas: 1')).toBeTruthy(); // a vencida não conta
    expect(screen.getByText('Start')).toBeTruthy();
    expect(screen.getByText(/R\$\s?15,00\/mês combinado/)).toBeTruthy();
    expect(screen.getByText(/Condição de lançamento até/)).toBeTruthy();
  });

  it('atalhos levam às telas certas', async () => {
    renderIt();
    await screen.findByLabelText('Visitas ao perfil: 120');
    const href = (txt: string) => screen.getByText(txt).closest('a')?.getAttribute('href');
    expect(href('Cadastrar produto')).toBe('/painel/empresa?aba=produtos');
    expect(href('Editar minha empresa')).toBe('/painel/empresa');
    expect(href('Criar promoção')).toBe('/painel/empresa?aba=funcoes');
    expect(href('Ver minha página')).toBe('/estabelecimento/e1');
    expect(href('Ver planos')).toBe('/painel/planos');
  });
});
