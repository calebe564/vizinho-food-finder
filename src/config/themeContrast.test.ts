import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Guarda de acessibilidade: os pares texto/fundo do tema precisam ter contraste mínimo
// de 4,5:1 (WCAG AA) nos dois temas. Se alguém mexer nas cores e piorar, o teste avisa.

type Hsl = [number, number, number];
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');

function tokens(selector: string): Record<string, Hsl> {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf('\n  }', start);
  const block = css.slice(start, end);
  const out: Record<string, Hsl> = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return out;
}

function hslToRgb([h, s, l]: Hsl): [number, number, number] {
  const S = s / 100, L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance(c: Hsl): number {
  const lin = (x: number) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = hslToRgb(c).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: Hsl, b: Hsl) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const PAIRS: [string, string][] = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['secondary-foreground', 'secondary'],
  ['primary', 'background'],
  ['primary-foreground', 'primary'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['success-foreground', 'success'],
  ['warning-foreground', 'warning'],
];

describe.each([
  ['tema claro', ':root'],
  ['tema escuro', '.dark'],
])('contraste do %s', (_nome, selector) => {
  const t = tokens(selector);
  it.each(PAIRS)('%s sobre %s tem pelo menos 4,5:1', (fg, bg) => {
    expect(t[fg], `token ${fg} ausente`).toBeDefined();
    expect(t[bg], `token ${bg} ausente`).toBeDefined();
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
