import { sanitizeUrl } from './sanitize';

/** Coordenadas válidas: números finitos dentro dos limites e fora do ponto (0, 0), que costuma ser "sem localização". */
export function validCoordinates(lat: unknown, lng: unknown): lat is number {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return !(lat === 0 && lng === 0);
}

/** Mapa do OpenStreetMap para incorporar na página (não exige chave de API). */
export function osmEmbedUrl(lat: number, lng: number, delta = 0.004): string | null {
  if (!validCoordinates(lat, lng)) return null;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].map((n) => n.toFixed(6)).join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
}

/** Rota até a empresa no Google Maps, a partir das coordenadas. */
export function directionsUrl(lat: number, lng: number): string | null {
  if (!validCoordinates(lat, lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
}

/** Link para "Como chegar": usa o link que a empresa cadastrou (se for seguro) ou monta pelas coordenadas. */
export function bestMapsLink(googleMapsLink: string | null | undefined, lat: unknown, lng: unknown): string | null {
  const own = sanitizeUrl((googleMapsLink ?? '').trim());
  if (/^https?:\/\//i.test(own)) return own;
  return validCoordinates(lat, lng) ? directionsUrl(lat as number, lng as number) : null;
}
