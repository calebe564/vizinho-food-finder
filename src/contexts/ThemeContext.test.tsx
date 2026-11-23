// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

type Listener = (e: MediaQueryListEvent) => void;

function mockMatchMedia(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<Listener>();
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() { return dark; },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return (next: boolean) => {
    dark = next;
    listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
  };
}

function Probe() {
  const { theme, preference, setPreference, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="pref">{preference}</span>
      <button onClick={() => setPreference('dark')}>escuro</button>
      <button onClick={() => setPreference('system')}>auto</button>
      <button onClick={toggleTheme}>alternar</button>
    </div>
  );
}

const renderProbe = () => render(<ThemeProvider><Probe /></ThemeProvider>);
const text = (id: string) => screen.getByTestId(id).textContent;

describe('ThemeProvider', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.className = '';
    document.head.innerHTML = '<meta name="theme-color" content="#0057FF">';
  });

  it('sem escolha salva, segue o aparelho (escuro) e aplica a classe', () => {
    mockMatchMedia(true);
    renderProbe();
    expect(text('pref')).toBe('system');
    expect(text('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#0c151d');
  });

  it('em automático, acompanha a mudança do aparelho em tempo real', () => {
    const setSystemDark = mockMatchMedia(false);
    renderProbe();
    expect(text('theme')).toBe('light');
    act(() => setSystemDark(true));
    expect(text('theme')).toBe('dark');
  });

  it('escolha manual ganha do aparelho e fica salva', () => {
    const setSystemDark = mockMatchMedia(false);
    renderProbe();
    act(() => screen.getByText('escuro').click());
    expect(text('theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    act(() => setSystemDark(false));
    expect(text('theme')).toBe('dark'); // não volta sozinho para claro
  });

  it('lembra da escolha salva ao abrir de novo', () => {
    mockMatchMedia(false);
    localStorage.setItem('theme', 'dark');
    renderProbe();
    expect(text('pref')).toBe('dark');
    expect(text('theme')).toBe('dark');
  });

  it('valor salvo inválido cai no automático', () => {
    mockMatchMedia(false);
    localStorage.setItem('theme', 'roxo');
    renderProbe();
    expect(text('pref')).toBe('system');
  });

  it('alternar troca claro e escuro', () => {
    mockMatchMedia(false);
    renderProbe();
    act(() => screen.getByText('alternar').click());
    expect(text('theme')).toBe('dark');
    act(() => screen.getByText('alternar').click());
    expect(text('theme')).toBe('light');
  });
});
