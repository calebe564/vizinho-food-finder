import { describe, it, expect } from 'vitest';
import { MASTER_ADMIN_EMAIL, isMasterAdminEmail } from './admin';

describe('administrador geral', () => {
  it('reconhece o e-mail sem diferenciar maiúsculas e espaços', () => {
    expect(isMasterAdminEmail(MASTER_ADMIN_EMAIL)).toBe(true);
    expect(isMasterAdminEmail('  ' + MASTER_ADMIN_EMAIL.toUpperCase() + ' ')).toBe(true);
  });
  it('não reconhece outros e-mails nem o domínio digitado errado', () => {
    expect(isMasterAdminEmail('outra@pessoa.com')).toBe(false);
    expect(isMasterAdminEmail(MASTER_ADMIN_EMAIL.replace('gmail', 'gmial'))).toBe(false);
    expect(isMasterAdminEmail(null)).toBe(false);
    expect(isMasterAdminEmail(undefined)).toBe(false);
  });
  it('usa o domínio gmail.com', () => {
    expect(MASTER_ADMIN_EMAIL.endsWith('@gmail.com')).toBe(true);
  });
});
