// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { AccessProfile } from '@/config/areas';
import { homeFor } from '@/config/areas';

const access = vi.hoisted(() => ({ value: null as unknown }));
vi.mock('@/hooks/useAccess', () => ({ useAccess: () => access.value }));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

import { AreaRoute } from './AreaRoute';
import { toast } from 'sonner';

function setAccess(profile: AccessProfile, opts: { loggedIn?: boolean; loading?: boolean } = {}) {
  const loggedIn = opts.loggedIn ?? true;
  access.value = {
    user: loggedIn ? { id: 'u1' } : null,
    isLoading: opts.loading ?? false,
    profile,
    home: homeFor(profile),
  };
}

function Where() {
  const loc = useLocation();
  return <div data-testid="onde">{loc.pathname}</div>;
}

function renderAt(path: string, area: 'comerciante' | 'admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Where />} />
        <Route path="/auth" element={<Where />} />
        <Route path="/painel/empresa" element={<AreaRoute area="comerciante"><div>Painel da empresa</div></AreaRoute>} />
        <Route path="/admin/dashboard" element={<AreaRoute area="admin"><div>Painel admin</div></AreaRoute>} />
      </Routes>
    </MemoryRouter>,
  );
  void area;
}

describe('AreaRoute', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks(); });
  afterEach(() => cleanup());

  it('mostra "verificando" enquanto carrega e não decide nada antes', () => {
    setAccess({ role: 'user', hasBusiness: false }, { loading: true });
    renderAt('/painel/empresa', 'comerciante');
    expect(screen.getByText('Verificando acesso...')).toBeTruthy();
  });

  it('visitante sem login vai para o login', () => {
    setAccess({ role: 'user', hasBusiness: false }, { loggedIn: false });
    renderAt('/painel/empresa', 'comerciante');
    expect(screen.getByTestId('onde').textContent).toBe('/auth');
  });

  it('consumidor comum não entra no painel do comerciante: volta ao site e recebe aviso', () => {
    setAccess({ role: 'user', hasBusiness: false });
    renderAt('/painel/empresa', 'comerciante');
    expect(screen.getByTestId('onde').textContent).toBe('/');
    expect(toast.info).toHaveBeenCalled();
  });

  it('comerciante entra no painel', () => {
    setAccess({ role: 'empresario', hasBusiness: true });
    renderAt('/painel/empresa', 'comerciante');
    expect(screen.getByText('Painel da empresa')).toBeTruthy();
  });

  it('comerciante não entra na administração; vai para o próprio painel', () => {
    setAccess({ role: 'empresario', hasBusiness: true });
    renderAt('/admin/dashboard', 'admin');
    expect(screen.queryByText('Painel admin')).toBeNull();
  });

  it('administrador (inclusive pre_adm) entra na administração', () => {
    setAccess({ role: 'pre_adm', hasBusiness: false });
    renderAt('/admin/dashboard', 'admin');
    expect(screen.getByText('Painel admin')).toBeTruthy();
  });

  it('administrador que abre o painel do comerciante é mandado para a administração', () => {
    setAccess({ role: 'admin', hasBusiness: false });
    renderAt('/painel/empresa', 'comerciante');
    expect(screen.queryByText('Painel da empresa')).toBeNull();
  });
});
