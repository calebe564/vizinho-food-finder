// Cores personalizadas de cada comerciante, com legibilidade garantida.
//
// Regras:
//  * A cor escolhida vira variáveis de CSS só dentro da página daquele comerciante.
//    Nada aqui toca a identidade geral do Comércio Vizinho nem a página de outro comerciante.
//  * O comerciante nunca coloca texto de CSS: só um hexadecimal (#RRGGBB) que passa por
//    validação estrita. As variáveis são montadas a partir de números, nunca de texto livre.
//  * Legibilidade (WCAG AA, 4,5:1): se a cor escolhida ficar ilegível no tema claro ou no
//    escuro, ela é ajustada automaticamente (só o brilho) até ficar legível, e o painel avisa.
//    A cor do texto sobre ela (branco ou escuro) também é escolhida pelo contraste.

export type Rgb = [number, number, number];
export type Hsl = [number, number, number]; // h 0-360, s 0-100, l 0-100

export type CustomizationLevel = 'none' | 'basic' | 'advanced';
export type CornerStyle = 'padrao' | 'reto' | 'arredondado';
export const CORNER_STYLES: readonly CornerStyle[] = ['padrao', 'reto', 'arredondado'];

export const MIN_TEXT_CONTRAST = 4.5;

const HEX = /^#[0-9a-fA-F]{6}$/;

export const isValidHex = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);

export function parseHex(hex: string): Rgb | null {
  if (!isValidHex(hex)) return null;
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export function toHex(rgb: Rgb): string {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [((h * 60) + 360) % 360, s * 100, l * 100];
}

export function hslToRgb([h, s, l]: Hsl): Rgb {
  const S = s / 100, L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Superfícies onde as cores aparecem (iguais às de index.css; um teste confere que não se afastam).
export const LIGHT_SURFACE: Rgb = hslToRgb([0, 0, 100]); // fundo e cartão do tema claro
export const DARK_SURFACE: Rgb = hslToRgb([209, 35, 12]); // cartão do tema escuro (o mais claro dos dois)
const DARK_TEXT: Rgb = hslToRgb([209, 40, 8]);
const WHITE: Rgb = [255, 255, 255];

/** Texto sobre a cor: branco ou escuro, o que tiver mais contraste. */
export function readableForeground(bg: Rgb): Rgb {
  return contrastRatio(WHITE, bg) >= contrastRatio(DARK_TEXT, bg) ? WHITE : DARK_TEXT;
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
/** "212 76% 55%": o mesmo formato das variáveis de cor do site. */
export const hslTriplet = ([h, s, l]: Hsl) => `${fmt(h)} ${fmt(s)}% ${fmt(l)}%`;
const fromRounded = ([h, s, l]: Hsl): Hsl => [Math.round(h * 10) / 10, Math.round(s * 10) / 10, Math.round(l * 10) / 10];

export interface Adjusted {
  hsl: Hsl; // já arredondado: é exatamente o que vai para o CSS
  rgb: Rgb; // a cor que a pessoa realmente vê
  changed: boolean; // a cor precisou ser ajustada para ficar legível
}

/**
 * Ajusta só o BRILHO da cor, em passos pequenos, até ter contraste suficiente com a superfície:
 * escurece no tema claro, clareia no tema escuro. O matiz e a saturação são mantidos.
 */
export function ensureReadable(hex: string, surface: Rgb, min = MIN_TEXT_CONTRAST): Adjusted | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [h, s, l0] = rgbToHsl(rgb);
  const goDarker = relativeLuminance(surface) > 0.5;

  let l = l0;
  let candidate = fromRounded([h, s, l]);
  for (let i = 0; i < 400; i++) {
    candidate = fromRounded([h, s, l]);
    if (contrastRatio(hslToRgb(candidate), surface) >= min) break;
    l += goDarker ? -0.5 : 0.5;
    if (l < 0 || l > 100) break;
  }
  const finalRgb = hslToRgb(candidate);
  const ok = contrastRatio(finalRgb, surface) >= min;
  // se chegou ao extremo sem conseguir (não acontece com estas superfícies), cai no texto padrão
  const safe: Hsl = ok ? candidate : goDarker ? [h, s, 0] : [h, s, 100];
  const safeRgb = hslToRgb(safe);
  const original = hslToRgb(fromRounded([h, s, l0]));
  return { hsl: safe, rgb: safeRgb, changed: contrastRatio(original, surface) < min };
}

export interface MerchantThemeInput {
  primary?: string | null;
  secondary?: string | null;
  radius?: CornerStyle | null;
}

/** O que o plano permite: 'basic' = cor principal; 'advanced' = + cor secundária e cantos. */
export function limitInputToLevel(input: MerchantThemeInput, level: CustomizationLevel): MerchantThemeInput | null {
  if (level === 'none') return null;
  const primary = isValidHex(input.primary) ? input.primary : null;
  if (level === 'basic') return primary ? { primary } : null;
  const secondary = isValidHex(input.secondary) ? input.secondary : null;
  const radius = input.radius && CORNER_STYLES.includes(input.radius) && input.radius !== 'padrao' ? input.radius : null;
  return primary || secondary || radius ? { primary, secondary, radius } : null;
}

export type ThemeVars = Record<string, string>;

export interface BuiltTheme {
  light: ThemeVars;
  dark: ThemeVars;
  /** Cores como a pessoa realmente vê em cada tema (para a prévia). */
  preview: {
    primary?: { light: string; dark: string };
    secondary?: { light: string; dark: string };
  };
  /** True se alguma cor foi ajustada para ficar legível. */
  adjusted: boolean;
}

const RADIUS_VALUE: Record<Exclude<CornerStyle, 'padrao'>, string> = { reto: '0.25rem', arredondado: '1.5rem' };

function colorVars(hex: string, names: { main: string; fg: string; ring?: string }) {
  const light = ensureReadable(hex, LIGHT_SURFACE);
  const dark = ensureReadable(hex, DARK_SURFACE);
  if (!light || !dark) return null;
  const vars = (a: Adjusted): ThemeVars => {
    const out: ThemeVars = {
      [names.main]: hslTriplet(a.hsl),
      [names.fg]: hslTriplet(rgbToHsl(readableForeground(a.rgb))),
    };
    if (names.ring) out[names.ring] = hslTriplet(a.hsl);
    return out;
  };
  return {
    light: vars(light),
    dark: vars(dark),
    previewLight: toHex(light.rgb),
    previewDark: toHex(dark.rgb),
    changed: light.changed || dark.changed,
  };
}

/**
 * Monta as variáveis de CSS do tema do comerciante, para o tema claro e para o escuro.
 * Devolve null quando não há nada a aplicar (plano sem personalização ou nenhuma cor válida).
 */
export function buildMerchantTheme(input: MerchantThemeInput, level: CustomizationLevel): BuiltTheme | null {
  const allowed = limitInputToLevel(input, level);
  if (!allowed) return null;

  const light: ThemeVars = {};
  const dark: ThemeVars = {};
  const preview: BuiltTheme['preview'] = {};
  let adjusted = false;

  if (allowed.primary) {
    const c = colorVars(allowed.primary, { main: '--primary', fg: '--primary-foreground', ring: '--ring' });
    if (c) {
      Object.assign(light, c.light);
      Object.assign(dark, c.dark);
      preview.primary = { light: c.previewLight, dark: c.previewDark };
      adjusted ||= c.changed;
    }
  }
  if (allowed.secondary) {
    const c = colorVars(allowed.secondary, { main: '--accent', fg: '--accent-foreground' });
    if (c) {
      Object.assign(light, c.light);
      Object.assign(dark, c.dark);
      preview.secondary = { light: c.previewLight, dark: c.previewDark };
      adjusted ||= c.changed;
    }
  }
  if (allowed.radius && allowed.radius !== 'padrao') {
    light['--radius'] = RADIUS_VALUE[allowed.radius];
    dark['--radius'] = RADIUS_VALUE[allowed.radius];
  }

  if (Object.keys(light).length === 0) return null;
  return { light, dark, preview, adjusted };
}

/** Estilo (React) para o tema atual. Só contém variáveis de CSS montadas por este módulo. */
export function themeStyle(theme: BuiltTheme | null, mode: 'light' | 'dark'): Record<string, string> | undefined {
  return theme ? { ...theme[mode] } : undefined;
}

/** Paletas prontas (matiz escolhido por nós; o ajuste de legibilidade continua valendo). */
export const PRESET_PALETTES: { name: string; primary: string; secondary: string }[] = [
  { name: 'Azul', primary: '#1048E8', secondary: '#F59E0B' },
  { name: 'Verde', primary: '#15803D', secondary: '#F97316' },
  { name: 'Rosa', primary: '#DB2777', secondary: '#0EA5E9' },
  { name: 'Vermelho', primary: '#DC2626', secondary: '#FACC15' },
  { name: 'Roxo', primary: '#7C3AED', secondary: '#10B981' },
  { name: 'Laranja', primary: '#EA580C', secondary: '#0F766E' },
  { name: 'Turquesa', primary: '#0D9488', secondary: '#E11D48' },
  { name: 'Grafite', primary: '#374151', secondary: '#F59E0B' },
];
