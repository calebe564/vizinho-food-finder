import { instagramUrl, websiteUrl } from './contactLinks';
import { validCoordinates } from './mapLinks';

export interface SeoEstablishment {
  name: string;
  description?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  phone?: string | null;
  website?: string | null;
  external_link?: string | null;
  instagram?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  profile_image?: string | null;
  banner_image?: string | null;
  rating_average?: number | null;
  rating_count?: number | null;
}

/** Corta o texto sem partir palavra e põe reticências. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function establishmentMetaDescription(e: SeoEstablishment, categoryName?: string): string {
  const where = [e.neighborhood, e.city].filter(Boolean).join(', ');
  const base = e.description?.trim()
    ? e.description
    : `${categoryName ?? 'Comércio'}${where ? ` em ${where}` : ''}. Veja endereço, horário, contato e produtos.`;
  return truncate(base, 160);
}

/**
 * Dados estruturados (schema.org/LocalBusiness) para o Google entender a página.
 * Usa SOMENTE dados reais da empresa: nada é inventado. A nota só entra se houver avaliações.
 */
export function buildLocalBusinessJsonLd(e: SeoEstablishment, pageUrl: string): Record<string, unknown> {
  const site = websiteUrl(e.website) || websiteUrl(e.external_link);
  const insta = instagramUrl(e.instagram);
  const images = [e.profile_image, e.banner_image].filter((u): u is string => !!u && /^https?:\/\//i.test(u));

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: e.name,
    url: pageUrl,
  };
  if (e.description?.trim()) data.description = truncate(e.description, 300);
  if (images.length) data.image = images;
  if (e.phone) data.telephone = e.phone;

  const address: Record<string, string> = { '@type': 'PostalAddress', addressCountry: 'BR' };
  if (e.address) address.streetAddress = e.address;
  if (e.city) address.addressLocality = e.city;
  if (e.state) address.addressRegion = e.state;
  if (e.cep) address.postalCode = e.cep;
  if (e.address || e.city) data.address = address;

  if (validCoordinates(e.latitude, e.longitude)) {
    data.geo = { '@type': 'GeoCoordinates', latitude: e.latitude, longitude: e.longitude };
  }
  const sameAs = [site, insta].filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;

  const count = e.rating_count ?? 0;
  const avg = e.rating_average ?? 0;
  if (count > 0 && avg > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(1)),
      reviewCount: count,
    };
  }
  return data;
}

/** JSON seguro para colocar dentro de <script type="application/ld+json">. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
