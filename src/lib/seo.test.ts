import { describe, it, expect } from 'vitest';
import { buildLocalBusinessJsonLd, establishmentMetaDescription, jsonLdScript, truncate } from './seo';

interface Ld {
  '@type': string;
  name: string;
  address: { addressCountry: string; streetAddress?: string };
  telephone?: string;
  aggregateRating?: unknown;
  geo?: { latitude: number };
  sameAs?: string[];
  image?: string[];
}

const base = { name: 'Padaria do Zé', address: 'Rua A, 10', city: 'Belo Horizonte', neighborhood: 'Barreiro', phone: '3133334444' };

describe('truncate', () => {
  it('corta sem partir palavra', () => {
    expect(truncate('uma frase bem comprida para cortar', 20)).toBe('uma frase bem…');
    expect(truncate('curta', 20)).toBe('curta');
    expect(truncate('  muito   espaço  ', 50)).toBe('muito espaço');
  });
});

describe('descrição da página', () => {
  it('usa a descrição da empresa, ou um texto padrão com o bairro', () => {
    expect(establishmentMetaDescription({ ...base, description: 'Pães feitos na hora.' })).toBe('Pães feitos na hora.');
    expect(establishmentMetaDescription(base, 'Padaria')).toContain('Padaria em Barreiro, Belo Horizonte');
    expect(establishmentMetaDescription({ ...base, description: 'x'.repeat(400) }).length).toBeLessThanOrEqual(160);
  });
});

describe('dados estruturados (JSON-LD)', () => {
  it('traz só dados reais e o endereço do Brasil', () => {
    const d = buildLocalBusinessJsonLd(base, 'https://site.com/estabelecimento/1') as unknown as Ld;
    expect(d['@type']).toBe('LocalBusiness');
    expect(d.name).toBe('Padaria do Zé');
    expect(d.address.addressCountry).toBe('BR');
    expect(d.address.streetAddress).toBe('Rua A, 10');
    expect(d.telephone).toBe('3133334444');
    expect(d.aggregateRating).toBeUndefined(); // sem avaliações, sem nota
    expect(d.geo).toBeUndefined(); // sem coordenadas válidas
  });
  it('inclui nota só se houver avaliações, e geo só com coordenadas válidas', () => {
    const d = buildLocalBusinessJsonLd(
      { ...base, rating_average: 4.46, rating_count: 12, latitude: -19.98, longitude: -44.03 },
      'https://site.com/e/1',
    ) as unknown as Ld;
    expect(d.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 12 });
    expect(d.geo.latitude).toBe(-19.98);
    const zero = buildLocalBusinessJsonLd({ ...base, rating_average: 5, rating_count: 0, latitude: 0, longitude: 0 }, 'u') as unknown as Ld;
    expect(zero.aggregateRating).toBeUndefined();
    expect(zero.geo).toBeUndefined();
  });
  it('só links seguros em sameAs e imagens', () => {
    const d = buildLocalBusinessJsonLd(
      { ...base, website: 'javascript:alert(1)', instagram: '@padaria.ze', profile_image: 'data:image/png;base64,xx' },
      'u',
    ) as unknown as Ld;
    expect(d.sameAs).toEqual(['https://www.instagram.com/padaria.ze']);
    expect(d.image).toBeUndefined();
  });
  it('o JSON não consegue fechar a tag <script>', () => {
    const out = jsonLdScript({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });
});
