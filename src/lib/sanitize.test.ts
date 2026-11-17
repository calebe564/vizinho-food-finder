import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtmlTags,
  sanitizeMessage,
  sanitizeName,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeSearchQuery,
} from './sanitize';

describe('escapeHtml / stripHtmlTags', () => {
  it('escapa caracteres especiais', () => {
    expect(escapeHtml('<b>"oi"</b>')).not.toContain('<');
    expect(escapeHtml('<b>"oi"</b>')).toContain('&lt;');
  });
  it('remove tags HTML', () => {
    expect(stripHtmlTags('<script>alert(1)</script>oi')).toBe('alert(1)oi');
  });
  it('aceita entradas inválidas sem quebrar', () => {
    expect(escapeHtml(undefined as unknown as string)).toBe('');
    expect(stripHtmlTags(null as unknown as string)).toBe('');
  });
});

describe('sanitizeMessage', () => {
  it('remove tags, protocolos perigosos e atributos on*', () => {
    const out = sanitizeMessage('<img src=x onerror=alert(1)> clique javascript:alert(1)');
    expect(out).not.toMatch(/<|javascript:|onerror\s*=/i);
  });
  it('limita o tamanho', () => {
    expect(sanitizeMessage('a'.repeat(50), 10)).toHaveLength(10);
  });
});

describe('sanitizeName / sanitizeEmail / sanitizeSearchQuery', () => {
  it('limpa nome', () => {
    expect(sanitizeName('  <b>Maria</b> {x} ')).toBe('Maria x');
  });
  it('normaliza e-mail', () => {
    expect(sanitizeEmail('  Maria@Exemplo.COM ')).toBe('maria@exemplo.com');
  });
  it('limpa busca e limita tamanho', () => {
    expect(sanitizeSearchQuery('<b>pizza</b>')).toBe('pizza');
    expect(sanitizeSearchQuery('x'.repeat(300))).toHaveLength(200);
  });
});

describe('sanitizeUrl', () => {
  it('mantém URLs seguras e completa as sem protocolo', () => {
    expect(sanitizeUrl('https://exemplo.com')).toBe('https://exemplo.com');
    expect(sanitizeUrl('exemplo.com')).toBe('https://exemplo.com');
    expect(sanitizeUrl('/rota')).toBe('/rota');
    expect(sanitizeUrl('tel:+5531999999999')).toBe('tel:+5531999999999');
  });
  it('bloqueia protocolos perigosos', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>1</script>')).toBe('');
    expect(sanitizeUrl('vbscript:x')).toBe('');
  });
});
