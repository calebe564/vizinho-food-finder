// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/untyped', () => ({ supabaseUntyped: { rpc } }));

import { getSessionId, isLikelyBot, shouldSend, trackEvent } from './tracking';

function memoryStore() {
  const data: Record<string, string> = {};
  return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; } };
}

beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: true, error: null }); sessionStorage.clear(); });

describe('getSessionId', () => {
  it('cria um identificador aleatório válido e reaproveita na mesma aba', () => {
    const store = memoryStore();
    const a = getSessionId(store);
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(getSessionId(store)).toBe(a);
  });
  it('ignora um valor salvo inválido', () => {
    const store = memoryStore();
    store.setItem('cv_session', 'x');
    expect(getSessionId(store)).not.toBe('x');
  });
  it('funciona mesmo sem armazenamento', () => {
    expect(getSessionId(null)).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe('isLikelyBot', () => {
  it('reconhece robôs e navegador automatizado', () => {
    expect(isLikelyBot({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).toBe(true);
    expect(isLikelyBot({ userAgent: 'HeadlessChrome/120' })).toBe(true);
    expect(isLikelyBot({ userAgent: 'Mozilla/5.0', webdriver: true })).toBe(true);
    expect(isLikelyBot({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1' })).toBe(false);
  });
});

describe('shouldSend', () => {
  it('visualização do mesmo item só segue depois de 30 minutos', () => {
    const store = memoryStore();
    const t0 = 1_000_000;
    expect(shouldSend('profile_view', 'e1', store, t0)).toBe(true);
    expect(shouldSend('profile_view', 'e1', store, t0 + 60_000)).toBe(false);
    expect(shouldSend('profile_view', 'e2', store, t0 + 60_000)).toBe(true);
    expect(shouldSend('profile_view', 'e1', store, t0 + 31 * 60_000)).toBe(true);
  });
  it('cliques sempre seguem (o servidor limita)', () => {
    const store = memoryStore();
    expect(shouldSend('whatsapp_click', 'e1', store)).toBe(true);
    expect(shouldSend('whatsapp_click', 'e1', store)).toBe(true);
  });
});

describe('trackEvent', () => {
  it('envia a visita com o identificador da aba', () => {
    trackEvent({ establishmentId: 'e1', type: 'profile_view' });
    expect(rpc).toHaveBeenCalledTimes(1);
    const [name, args] = rpc.mock.calls[0];
    expect(name).toBe('track_event');
    expect(args).toMatchObject({ _establishment_id: 'e1', _event_type: 'profile_view', _product_id: null });
    expect(args._session_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
  it('recarregar a página não envia a visita duas vezes', () => {
    trackEvent({ establishmentId: 'e1', type: 'profile_view' });
    trackEvent({ establishmentId: 'e1', type: 'profile_view' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('produto leva o id do produto', () => {
    trackEvent({ establishmentId: 'e1', type: 'product_view', productId: 'p1' });
    expect(rpc.mock.calls[0][1]).toMatchObject({ _product_id: 'p1' });
  });
  it('sem id da empresa não envia nada', () => {
    trackEvent({ establishmentId: undefined, type: 'profile_view' });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('se o servidor falhar, nada quebra', async () => {
    rpc.mockRejectedValue(new Error('rede'));
    expect(() => trackEvent({ establishmentId: 'e9', type: 'whatsapp_click' })).not.toThrow();
    await Promise.resolve();
  });
});
