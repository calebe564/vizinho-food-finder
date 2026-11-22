// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'dono@loja.com' },
    profile: { full_name: 'Maria Dona' },
    signOut: vi.fn(),
  }),
}));
vi.mock('@/hooks/useUnreadConversations', () => ({ useUnreadConversations: () => ({ unreadCount: 0 }) }));
vi.mock('./ThemeToggle', () => ({ ThemeToggle: () => null }));

import { MerchantHeader } from './MerchantHeader';

afterEach(() => cleanup());

describe('MerchantHeader (área do comerciante)', () => {
  const renderHeader = () =>
    render(
      <MemoryRouter initialEntries={['/painel/empresa']}>
        <MerchantHeader />
      </MemoryRouter>,
    );

  it('mostra só as ferramentas da empresa', () => {
    renderHeader();
    expect(screen.getAllByText('Visão geral').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Minha empresa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Suporte').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Painel do comerciante').length).toBeGreaterThan(0);
  });

  it('não traz a vitrine do consumidor nem a administração', () => {
    renderHeader();
    ['Bússola', 'Categorias', 'Favoritos', 'Painel administrativo', 'Cadastre sua empresa'].forEach((txt) =>
      expect(screen.queryByText(txt)).toBeNull(),
    );
  });

  it('oferece voltar ao site como cliente', () => {
    renderHeader();
    const link = screen.getAllByRole('link').find((a) => a.textContent?.includes('Ver como cliente'));
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('os links do painel apontam para /painel e /suporte', () => {
    renderHeader();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/painel');
    expect(hrefs).toContain('/painel/empresa');
    expect(hrefs).toContain('/painel/planos');
    expect(hrefs).toContain('/suporte');
  });
});
