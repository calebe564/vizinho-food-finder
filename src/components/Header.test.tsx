// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com' }, profile: { full_name: 'Ana' }, signOut: vi.fn(), isAdmin: false }),
}));
vi.mock('@/hooks/useAccess', () => ({
  useAccess: () => ({ profile: { role: 'user', hasBusiness: false } }),
}));
vi.mock('@/hooks/useFavorites', () => ({ useFavorites: () => ({ totalFavorites: 0 }) }));
vi.mock('@/hooks/useUnreadConversations', () => ({ useUnreadConversations: () => ({ unreadCount: 0 }) }));
vi.mock('@/hooks/useAdminNotifications', () => ({ useAdminNotifications: () => ({ counts: { total: 0 } }) }));
vi.mock('./AIChatSheet', () => ({ AIChatSheet: () => null }));
vi.mock('./ThemeToggle', () => ({ ThemeToggle: () => null }));

import { Header } from './Header';

afterEach(() => cleanup());

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  );

describe('Header troca de acordo com a área', () => {
  it('no site do consumidor mostra a navegação de descoberta', () => {
    renderAt('/');
    expect(screen.getAllByText('Bússola').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Empresas').length).toBeGreaterThan(0);
    expect(screen.queryByText('Painel do comerciante')).toBeNull();
  });

  it('em /painel mostra o cabeçalho do comerciante e some a vitrine', () => {
    renderAt('/painel/empresa');
    expect(screen.getAllByText('Painel do comerciante').length).toBeGreaterThan(0);
    expect(screen.queryByText('Bússola')).toBeNull();
  });

  it('/planos (página pública) continua no cabeçalho do consumidor', () => {
    renderAt('/planos');
    expect(screen.getAllByText('Bússola').length).toBeGreaterThan(0);
  });
});
