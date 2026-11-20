// As três áreas do Comércio Vizinho e quem entra em cada uma.
//
//  * Consumidor  : o site público (descobrir comércios e produtos).
//  * Comerciante : o painel da empresa, em /painel.
//  * Administrador: a equipe, em /admin/dashboard.
//
// Funcionalidades de uma área não aparecem nas outras. Estas regras são só de navegação
// (o que mostrar e para onde mandar); quem protege os dados de verdade é o banco (RLS).
import type { UserRole } from '@/hooks/useUserRole';

export type Area = 'consumidor' | 'comerciante' | 'admin';

export const MERCHANT_BASE = '/painel';
export const MERCHANT_HOME = '/painel/empresa';
export const ADMIN_HOME = '/admin/dashboard';

export const ADMIN_ROLES: readonly UserRole[] = ['adm_master', 'admin', 'pre_adm'];

export interface AccessProfile {
  role: UserRole;
  /** Tem empresa aprovada (ou cadastro aprovado) vinculada à conta. */
  hasBusiness: boolean;
}

export const isAdminRole = (role: UserRole): boolean => ADMIN_ROLES.includes(role);

export function canAccess(area: Area, profile: AccessProfile): boolean {
  switch (area) {
    case 'admin':
      return isAdminRole(profile.role);
    case 'comerciante':
      return profile.role === 'empresario' || profile.hasBusiness;
    case 'consumidor':
    default:
      return true;
  }
}

export function accessibleAreas(profile: AccessProfile): Area[] {
  return (['consumidor', 'comerciante', 'admin'] as Area[]).filter((a) => canAccess(a, profile));
}

/** Página inicial de cada tipo de usuário (administração > comerciante > consumidor). */
export function homeFor(profile: AccessProfile): string {
  if (canAccess('admin', profile)) return ADMIN_HOME;
  if (canAccess('comerciante', profile)) return MERCHANT_HOME;
  return '/';
}

/** Para depois do login, quando só a função (papel) é conhecida. */
export function homeForRole(role: UserRole): string {
  return homeFor({ role, hasBusiness: false });
}

/** A rota pertence à área do comerciante? (usado para trocar o cabeçalho) */
export function isMerchantPath(pathname: string): boolean {
  return pathname === MERCHANT_BASE || pathname.startsWith(`${MERCHANT_BASE}/`);
}

// ---------------------------------------------------------------------------
// Itens do menu do site (área do consumidor). Um só lugar para o menu do computador e do
// celular, para que nada de comerciante ou de administração vaze para o consumidor.
// ---------------------------------------------------------------------------
export type MenuEntryId = 'cadastrar' | 'reivindicar' | 'painel' | 'suporte' | 'admin';

export interface MenuEntry {
  id: MenuEntryId;
  label: string;
  to: string;
  area: Area;
}

export function consumerMenuEntries(profile: AccessProfile, loggedIn: boolean): MenuEntry[] {
  const admin = loggedIn && canAccess('admin', profile);
  const merchant = loggedIn && !admin && canAccess('comerciante', profile);
  const entries: MenuEntry[] = [];

  if (admin) {
    entries.push({ id: 'admin', label: 'Painel administrativo', to: ADMIN_HOME, area: 'admin' });
    return entries;
  }

  if (merchant) {
    entries.push({ id: 'painel', label: 'Meu painel', to: MERCHANT_HOME, area: 'comerciante' });
  } else {
    // "Cadastre sua empresa" fica na área do consumidor: é a porta de entrada para virar comerciante.
    entries.push({ id: 'cadastrar', label: 'Cadastre sua empresa', to: '/cadastrar', area: 'consumidor' });
    if (loggedIn) {
      entries.push({ id: 'reivindicar', label: 'Reivindicar empresa', to: '/reivindicar-empresa', area: 'consumidor' });
    }
  }

  if (loggedIn) {
    entries.push({ id: 'suporte', label: 'Suporte', to: '/suporte', area: 'consumidor' });
  }
  return entries;
}
