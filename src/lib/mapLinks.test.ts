import { describe, it, expect } from 'vitest';
import { validCoordinates, osmEmbedUrl, directionsUrl, bestMapsLink } from './mapLinks';

describe('validCoordinates', () => {
  it('aceita coordenadas reais e recusa lixo', () => {
    expect(validCoordinates(-19.9833, -44.0333)).toBe(true);
    expect(validCoordinates(0, 0)).toBe(false);
    expect(validCoordinates(91, 0)).toBe(false);
    expect(validCoordinates(0, 181)).toBe(false);
    expect(validCoordinates(NaN, 1)).toBe(false);
    expect(validCoordinates('-19.9', '-44.0')).toBe(false);
    expect(validCoordinates(null, undefined)).toBe(false);
  });
});

describe('links de mapa', () => {
  it('monta o mapa incorporado com o marcador no ponto certo', () => {
    const url = osmEmbedUrl(-19.9833, -44.0333)!;
    expect(url.startsWith('https://www.openstreetmap.org/export/embed.html?bbox=')).toBe(true);
    expect(url).toContain('marker=-19.983300%2C-44.033300');
    expect(osmEmbedUrl(0, 0)).toBeNull();
  });
  it('monta a rota do Google Maps', () => {
    expect(directionsUrl(-19.9833, -44.0333)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-19.983300%2C-44.033300',
    );
    expect(directionsUrl(200, 0)).toBeNull();
  });
  it('prefere o link da empresa se for seguro; senão usa as coordenadas', () => {
    expect(bestMapsLink('https://maps.app.goo.gl/abc', -19.9, -44.0)).toBe('https://maps.app.goo.gl/abc');
    expect(bestMapsLink('javascript:alert(1)', -19.9, -44.0)).toContain('google.com/maps/dir');
    expect(bestMapsLink('', -19.9, -44.0)).toContain('google.com/maps/dir');
    expect(bestMapsLink(null, 0, 0)).toBeNull();
  });
});
