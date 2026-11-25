// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BrandLogo, BrandMark } from './BrandLogo';

afterEach(() => cleanup());

describe('BrandLogo', () => {
  it('mostra o nome em duas linhas, como no modelo: "Comércio" e "Vizinho"', () => {
    render(<BrandLogo />);
    expect(screen.getByText('Comércio')).toBeTruthy();
    expect(screen.getByText('Vizinho')).toBeTruthy();
    const lines = screen.getByText('Comércio').parentElement!;
    expect(lines.className).toContain('flex-col');
  });

  it('é um único item para leitor de tela, com o nome da marca', () => {
    render(<BrandLogo />);
    expect(screen.getByRole('img', { name: 'Comércio Vizinho' })).toBeTruthy();
  });

  it('o símbolo é decorativo e usa a cor da marca (que muda no tema escuro)', () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const colored = Array.from(svg.querySelectorAll('ellipse, path')).map((el) => (el as SVGElement).getAttribute('style') ?? '');
    expect(colored.filter((s) => s.includes('var(--brand-blue)')).length).toBe(2);
  });

  it('vários logotipos na mesma página não se atrapalham (recorte com id único)', () => {
    const { container } = render(<><BrandMark /><BrandMark /></>);
    const masks = Array.from(container.querySelectorAll('mask')).map((m) => m.id);
    expect(masks).toHaveLength(2);
    expect(new Set(masks).size).toBe(2);
    container.querySelectorAll('ellipse').forEach((e, i) => expect(e.getAttribute('mask')).toBe(`url(#${masks[i]})`));
  });

  it('tamanhos', () => {
    const { container } = render(<BrandLogo size="lg" />);
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('h-12');
  });
});

describe('cores e ícones do logotipo', () => {
  const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');
  it('azul do logotipo no tema claro e um azul mais claro no escuro', () => {
    expect(css).toMatch(/:root \{[\s\S]*?--brand-blue: #1048E8;/);
    expect(css).toMatch(/\.dark \{[\s\S]*?--brand-blue: #4C7DFF;/);
  });
  it('o logotipo estático (aba do navegador) usa o mesmo azul e não tem fundo branco', () => {
    const svg = readFileSync(resolve(__dirname, '../../public/favicon.svg'), 'utf-8');
    expect(svg).toContain('#1048E8');
    // o único retângulo branco é o da máscara de recorte; fora dela não há fundo
    expect(svg.replace(/<mask[\s\S]*?<\/mask>/, '')).not.toMatch(/<rect/i);
  });
});
