import { describe, it, expect } from 'vitest';
import {
  accessibleAreas,
  canAccess,
  consumerMenuEntries,
  homeFor,
  homeForRole,
  isAdminRole,
  isMerchantPath,
  MERCHANT_COMPANY,
  MERCHANT_HOME,
  type AccessProfile,
} from './areas';

const consumer: AccessProfile = { role: 'user', hasBusiness: false };
const merchantByRole: AccessProfile = { role: 'empresario', hasBusiness: false };
const merchantByBusiness: AccessProfile = { role: 'user', hasBusiness: true };
const admin: AccessProfile = { role: 'admin', hasBusiness: false };
const master: AccessProfile = { role: 'adm_master', hasBusiness: false };
const preAdmin: AccessProfile = { role: 'pre_adm', hasBusiness: false };

describe('quem entra em cada área', () => {
  it('consumidor comum só tem o site público', () => {
    expect(accessibleAreas(consumer)).toEqual(['consumidor']);
    expect(canAccess('comerciante', consumer)).toBe(false);
    expect(canAccess('admin', consumer)).toBe(false);
  });
  it('comerciante: por função ou por ter empresa aprovada', () => {
    expect(canAccess('comerciante', merchantByRole)).toBe(true);
    expect(canAccess('comerciante', merchantByBusiness)).toBe(true);
    expect(canAccess('admin', merchantByRole)).toBe(false);
  });
  it('administração: adm_master, admin e pre_adm (pre_adm era barrado por engano)', () => {
    [admin, master, preAdmin].forEach((p) => expect(canAccess('admin', p)).toBe(true));
    expect(isAdminRole('pre_adm')).toBe(true);
    expect(isAdminRole('empresario')).toBe(false);
  });
});

describe('para onde cada um vai', () => {
  it('administração > comerciante > consumidor', () => {
    expect(homeFor(admin)).toBe('/admin/dashboard');
    expect(homeFor({ role: 'admin', hasBusiness: true })).toBe('/admin/dashboard');
    expect(homeFor(merchantByRole)).toBe('/painel');
    expect(homeFor(merchantByBusiness)).toBe('/painel');
    expect(homeFor(consumer)).toBe('/');
    expect(homeForRole('pre_adm')).toBe('/admin/dashboard');
    expect(homeForRole('empresario')).toBe('/painel');
    expect(homeForRole('user')).toBe('/');
  });
  it('reconhece caminhos do painel do comerciante', () => {
    expect(isMerchantPath('/painel')).toBe(true);
    expect(isMerchantPath('/painel/planos')).toBe(true);
    expect(isMerchantPath('/painelzinho')).toBe(false);
    expect(isMerchantPath('/planos')).toBe(false);
  });
});

describe('painel do comerciante', () => {
  it('a visão geral é a página inicial e a página da empresa fica em /painel/empresa', () => {
    expect(MERCHANT_HOME).toBe('/painel');
    expect(MERCHANT_COMPANY).toBe('/painel/empresa');
    expect(isMerchantPath(MERCHANT_COMPANY)).toBe(true);
  });
  it('"Meu painel" no menu do site leva à visão geral', () => {
    const entry = consumerMenuEntries(merchantByRole, true).find((e) => e.id === 'painel');
    expect(entry?.to).toBe('/painel');
  });
});

describe('menu do site (consumidor): nada de outra área vaza', () => {
  const ids = (p: AccessProfile, loggedIn: boolean) => consumerMenuEntries(p, loggedIn).map((e) => e.id);

  it('visitante vê só "Cadastre sua empresa"', () => {
    expect(ids(consumer, false)).toEqual(['cadastrar']);
  });
  it('consumidor logado: cadastrar, reivindicar e suporte; sem plano, painel ou admin', () => {
    expect(ids(consumer, true)).toEqual(['cadastrar', 'reivindicar', 'suporte']);
  });
  it('comerciante logado: vê o painel, não vê cadastrar nem reivindicar', () => {
    expect(ids(merchantByRole, true)).toEqual(['painel', 'suporte']);
  });
  it('administrador vê apenas o painel administrativo', () => {
    expect(ids(admin, true)).toEqual(['admin']);
    expect(ids(preAdmin, true)).toEqual(['admin']);
  });
  it('nenhum perfil recebe "plano" no menu do site', () => {
    [consumer, merchantByRole, admin].forEach((p) =>
      consumerMenuEntries(p, true).forEach((e) => expect(e.to).not.toMatch(/planos/)),
    );
  });
  it('"Cadastre sua empresa" usa a redação do documento', () => {
    expect(consumerMenuEntries(consumer, false)[0].label).toBe('Cadastre sua empresa');
  });
});
