import { describe, it, expect } from 'vitest';
import { normalizeString, getCanonicalNeighborhood } from './locationUtils';

describe('normalizeString', () => {
  it('remove acentos, pontuação e espaços sobrando', () => {
    expect(normalizeString('  Vila   Pinhó (Barreiro) ')).toBe('vila pinho barreiro');
  });
  it('lida com entrada vazia ou inválida', () => {
    expect(normalizeString('')).toBe('');
    expect(normalizeString(undefined as unknown as string)).toBe('');
  });
});

describe('getCanonicalNeighborhood', () => {
  it('agrupa variações de escrita do mesmo bairro', () => {
    const a = getCanonicalNeighborhood('Vila Pinho');
    expect(getCanonicalNeighborhood('vila pinho (barreiro)')).toBe(a);
    expect(getCanonicalNeighborhood('Vila Pinho - Barreiro')).toBe(a);
  });
  it('devolve vazio para entrada vazia', () => {
    expect(getCanonicalNeighborhood('')).toBe('');
  });
});
