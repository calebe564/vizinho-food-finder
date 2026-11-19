// E-mail do administrador geral (adm_master).
// IMPORTANTE: o banco confere o MESMO e-mail na função `is_adm_master`
// (migration 20261118000000_admin_geral.sql). Se trocar aqui, troque lá também.
export const MASTER_ADMIN_EMAIL = 'calebesouzamartins45@gmail.com';

export const isMasterAdminEmail = (email?: string | null): boolean =>
  (email ?? '').trim().toLowerCase() === MASTER_ADMIN_EMAIL;
