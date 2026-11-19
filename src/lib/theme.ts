// Lógica do tema (claro, escuro ou automático). Separada do React para poder ser testada.

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/** Cor da barra do navegador no celular (meta theme-color). */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#0057FF',
  dark: '#0c151d',
};

export function parsePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

/** Quem nunca escolheu (ou tem um valor inválido salvo) fica no automático. */
export function readStoredPreference(storage?: Pick<Storage, 'getItem'>): ThemePreference {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    return parsePreference(store?.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

export function systemPrefersDark(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/** Aplica o tema ao documento: classe, color-scheme (barras de rolagem, campos) e cor da barra do navegador. */
export function applyTheme(theme: ResolvedTheme, doc: Document = document): void {
  const root = doc.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}
