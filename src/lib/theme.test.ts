import { describe, it, expect } from 'vitest';
import { parsePreference, readStoredPreference, resolveTheme } from './theme';

describe('parsePreference', () => {
  it('aceita só os três valores; qualquer outra coisa vira automático', () => {
    expect(parsePreference('light')).toBe('light');
    expect(parsePreference('dark')).toBe('dark');
    expect(parsePreference('system')).toBe('system');
    expect(parsePreference('azul')).toBe('system');
    expect(parsePreference(null)).toBe('system');
    expect(parsePreference(undefined)).toBe('system');
  });
});

describe('readStoredPreference', () => {
  it('lê o valor salvo e cai no automático se não houver ou se der erro', () => {
    expect(readStoredPreference({ getItem: () => 'dark' })).toBe('dark');
    expect(readStoredPreference({ getItem: () => null })).toBe('system');
    expect(readStoredPreference({ getItem: () => { throw new Error('bloqueado'); } })).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('escolha manual vale sempre; automático segue o aparelho', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});
