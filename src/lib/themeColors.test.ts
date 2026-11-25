import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DARK_SURFACE,
  LIGHT_SURFACE,
  MIN_TEXT_CONTRAST,
  PRESET_PALETTES,
  buildMerchantTheme,
  contrastRatio,
  ensureReadable,
  hslToRgb,
  isValidHex,
  limitInputToLevel,
  parseHex,
  readableForeground,
  rgbToHsl,
  toHex,
  type Hsl,
  type ThemeVars,
} from './themeColors';

const rgbOfTriplet = (triplet: string) => {
  const [h, s, l] = triplet.split(' ').map((p) => parseFloat(p));
  return hslToRgb([h, s, l] as Hsl);
};

// gerador pseudoaleatório fixo, para o teste dar sempre o mesmo resultado
function rng(seed: number) {
  let a = seed;
  return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; };
}

describe('validação de hexadecimal', () => {
  it('só aceita #RRGGBB', () => {
    expect(isValidHex('#1048E8')).toBe(true);
    expect(isValidHex('#1048e8')).toBe(true);
    ['', '1048E8', '#fff', '#1048E', '#1048E8F', '#GGGGGG', 'red', 'rgb(0,0,0)', '#1048E8; background:url(x)', '#1048E8"><script>', null, undefined, 123].forEach((v) =>
      expect(isValidHex(v)).toBe(false),
    );
  });
});

describe('conversões e contraste (WCAG)', () => {
  it('contraste de preto e branco é 21:1; igual a igual é 1:1', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBeCloseTo(1, 5);
  });
  it('valores conhecidos', () => {
    expect(contrastRatio(parseHex('#767676')!, [255, 255, 255])).toBeCloseTo(4.54, 1); // cinza mais claro que passa em AA
    expect(contrastRatio(parseHex('#777777')!, [255, 255, 255])).toBeLessThan(4.5);
  });
  it('hex <-> rgb <-> hsl voltam ao mesmo lugar', () => {
    for (const hex of ['#1048E8', '#DB2777', '#15803D', '#FACC15', '#000000', '#FFFFFF', '#808080']) {
      const rgb = parseHex(hex)!;
      expect(toHex(hslToRgb(rgbToHsl(rgb)))).toBe(hex);
    }
  });
  it('texto sobre a cor: branco em fundo escuro, escuro em fundo claro', () => {
    expect(readableForeground([16, 72, 232])).toEqual([255, 255, 255]);
    expect(readableForeground([250, 204, 21])[0]).toBeLessThan(50);
  });
});

describe('ensureReadable', () => {
  it('não mexe numa cor que já é legível', () => {
    const r = ensureReadable('#15803D', LIGHT_SURFACE)!;
    expect(r.changed).toBe(false);
    expect(toHex(r.rgb)).toBe('#15803D');
  });
  it('escurece no tema claro e clareia no tema escuro, mantendo o matiz', () => {
    const light = ensureReadable('#FACC15', LIGHT_SURFACE)!; // amarelo: ilegível sobre branco
    expect(light.changed).toBe(true);
    expect(contrastRatio(light.rgb, LIGHT_SURFACE)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(Math.abs(rgbToHsl(light.rgb)[0] - rgbToHsl(parseHex('#FACC15')!)[0])).toBeLessThan(2);
    const dark = ensureReadable('#1E3A8A', DARK_SURFACE)!; // azul escuro: ilegível sobre fundo escuro
    expect(dark.changed).toBe(true);
    expect(contrastRatio(dark.rgb, DARK_SURFACE)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
  it('branco puro e preto puro viram cinzas legíveis', () => {
    expect(contrastRatio(ensureReadable('#FFFFFF', LIGHT_SURFACE)!.rgb, LIGHT_SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ensureReadable('#000000', DARK_SURFACE)!.rgb, DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
  });
  it('rejeita hexadecimal inválido', () => {
    expect(ensureReadable('azul', LIGHT_SURFACE)).toBeNull();
  });
});

describe('buildMerchantTheme: legibilidade garantida para QUALQUER cor', () => {
  it('600 cores aleatórias: cor e texto sobre ela legíveis nos dois temas, cor principal e secundária', () => {
    const random = rng(42);
    for (let i = 0; i < 600; i++) {
      const hex = toHex([random() * 255, random() * 255, random() * 255]);
      const theme = buildMerchantTheme({ primary: hex, secondary: hex }, 'advanced')!;
      expect(theme).not.toBeNull();
      for (const [mode, surface] of [['light', LIGHT_SURFACE], ['dark', DARK_SURFACE]] as const) {
        const vars: ThemeVars = theme[mode];
        for (const [main, fg] of [['--primary', '--primary-foreground'], ['--accent', '--accent-foreground']] as const) {
          const color = rgbOfTriplet(vars[main]);
          expect(contrastRatio(color, surface), `${hex} ${mode} ${main}`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
          expect(contrastRatio(rgbOfTriplet(vars[fg]), color), `${hex} ${mode} ${fg}`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        }
      }
    }
  });

  it('as paletas prontas continuam legíveis nos dois temas', () => {
    for (const p of PRESET_PALETTES) {
      const theme = buildMerchantTheme({ primary: p.primary, secondary: p.secondary }, 'advanced')!;
      expect(contrastRatio(rgbOfTriplet(theme.light['--primary']), LIGHT_SURFACE)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(rgbOfTriplet(theme.dark['--primary']), DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('só gera variáveis de cor e de cantos, nunca outras propriedades', () => {
    const theme = buildMerchantTheme({ primary: '#1048E8', secondary: '#F59E0B', radius: 'reto' }, 'advanced')!;
    const allowed = new Set(['--primary', '--primary-foreground', '--ring', '--accent', '--accent-foreground', '--radius']);
    [...Object.keys(theme.light), ...Object.keys(theme.dark)].forEach((k) => expect(allowed.has(k)).toBe(true));
    [...Object.values(theme.light), ...Object.values(theme.dark)].forEach((v) => expect(v).toMatch(/^(\d+(\.\d)? \d+(\.\d)?% \d+(\.\d)?%|\d(\.\d+)?rem)$/));
  });

  it('um texto malicioso no lugar da cor não produz nada', () => {
    expect(buildMerchantTheme({ primary: '#fff; background:url(http://x)' }, 'advanced')).toBeNull();
    expect(buildMerchantTheme({ primary: 'red' }, 'basic')).toBeNull();
  });

  it('avisa quando precisou ajustar a cor', () => {
    expect(buildMerchantTheme({ primary: '#FACC15' }, 'basic')!.adjusted).toBe(true);
    expect(buildMerchantTheme({ primary: '#1048E8' }, 'basic')!.adjusted).toBe(true); // no escuro precisa clarear
    expect(buildMerchantTheme({ primary: '#7C9BFF' }, 'basic')!.preview.primary).toBeTruthy();
  });
});

describe('o plano limita o que vale (a tela e o servidor concordam)', () => {
  const all = { primary: '#1048E8', secondary: '#F59E0B', radius: 'arredondado' as const };
  it('sem plano de personalização: nada é aplicado', () => {
    expect(limitInputToLevel(all, 'none')).toBeNull();
    expect(buildMerchantTheme(all, 'none')).toBeNull();
  });
  it('básico: só a cor principal', () => {
    expect(limitInputToLevel(all, 'basic')).toEqual({ primary: '#1048E8' });
    const t = buildMerchantTheme(all, 'basic')!;
    expect(Object.keys(t.light)).not.toContain('--accent');
    expect(Object.keys(t.light)).not.toContain('--radius');
  });
  it('avançado: principal, secundária e cantos', () => {
    const t = buildMerchantTheme(all, 'advanced')!;
    expect(Object.keys(t.light)).toEqual(expect.arrayContaining(['--primary', '--accent', '--radius']));
    expect(t.light['--radius']).toBe('1.5rem');
  });
  it('"padrão" nos cantos e sem cores: nada a aplicar (tema padrão do site)', () => {
    expect(buildMerchantTheme({ radius: 'padrao' }, 'advanced')).toBeNull();
    expect(buildMerchantTheme({}, 'advanced')).toBeNull();
  });
});

describe('as superfícies usadas no cálculo acompanham o index.css', () => {
  const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');
  const token = (selector: string, name: string): Hsl => {
    const block = css.slice(css.indexOf(`${selector} {`), css.indexOf('\n  }', css.indexOf(`${selector} {`)));
    const m = block.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`))!;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };
  it('tema claro: fundo e cartão brancos', () => {
    expect(contrastRatio(hslToRgb(token(':root', 'background')), LIGHT_SURFACE)).toBeCloseTo(1, 1);
    expect(contrastRatio(hslToRgb(token(':root', 'card')), LIGHT_SURFACE)).toBeCloseTo(1, 1);
  });
  it('tema escuro: o cartão é a superfície usada e o fundo é mais escuro que ela', () => {
    expect(contrastRatio(hslToRgb(token('.dark', 'card')), DARK_SURFACE)).toBeCloseTo(1, 1);
    expect(contrastRatio(hslToRgb(token('.dark', 'background')), DARK_SURFACE)).toBeGreaterThanOrEqual(1);
    expect(contrastRatio(hslToRgb(token('.dark', 'background')), [255, 255, 255])).toBeGreaterThan(contrastRatio(DARK_SURFACE, [255, 255, 255]));
  });
});
