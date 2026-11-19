import { describe, it, expect } from 'vitest';
import { instagramUrl, instagramHandle, websiteUrl, websiteLabel, mailtoUrl } from './contactLinks';

describe('instagramUrl', () => {
  it('aceita @usuario, usuario e link completo', () => {
    expect(instagramUrl('@padaria.do.ze')).toBe('https://www.instagram.com/padaria.do.ze');
    expect(instagramUrl('padaria.do.ze')).toBe('https://www.instagram.com/padaria.do.ze');
    expect(instagramUrl('https://instagram.com/padaria.do.ze')).toBe('https://instagram.com/padaria.do.ze');
    expect(instagramUrl('instagram.com/padaria.do.ze')).toBe('https://instagram.com/padaria.do.ze');
  });
  it('rejeita lixo, outros sites e esquemas perigosos', () => {
    expect(instagramUrl('')).toBeNull();
    expect(instagramUrl(null)).toBeNull();
    expect(instagramUrl('nome com espaço')).toBeNull();
    expect(instagramUrl('https://evil.com/instagram.com')).toBeNull();
    expect(instagramUrl('javascript:alert(1)')).toBeNull();
  });
  it('mostra o @ do perfil', () => {
    expect(instagramHandle('https://www.instagram.com/loja_x/')).toBe('@loja_x');
    expect(instagramHandle('x y')).toBe('');
  });
});

describe('websiteUrl', () => {
  it('completa o protocolo e valida', () => {
    expect(websiteUrl('exemplo.com.br')).toBe('https://exemplo.com.br/');
    expect(websiteUrl('http://exemplo.com')).toBe('http://exemplo.com/');
    expect(websiteLabel('https://www.exemplo.com.br/loja')).toBe('exemplo.com.br');
  });
  it('bloqueia protocolos perigosos e vazio', () => {
    expect(websiteUrl('javascript:alert(1)')).toBeNull();
    expect(websiteUrl('data:text/html,x')).toBeNull();
    expect(websiteUrl('   ')).toBeNull();
    expect(websiteUrl(undefined)).toBeNull();
  });
});

describe('mailtoUrl', () => {
  it('valida e-mail', () => {
    expect(mailtoUrl('contato@loja.com')).toBe('mailto:contato@loja.com');
    expect(mailtoUrl('sem-arroba')).toBeNull();
    expect(mailtoUrl('')).toBeNull();
  });
});
