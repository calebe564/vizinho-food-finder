import { sanitizeUrl } from './sanitize';

const INSTAGRAM_USER = /^[A-Za-z0-9._]{1,30}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Aceita "@usuario", "usuario" ou o link completo e devolve o link do perfil (ou null). */
export function instagramUrl(value?: string | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw) || /^(www\.)?instagram\.com\//i.test(raw)) {
    const safe = sanitizeUrl(raw);
    try {
      const url = new URL(safe);
      return /(^|\.)instagram\.com$/i.test(url.hostname) ? url.toString() : null;
    } catch {
      return null;
    }
  }

  const user = raw.replace(/^@/, '');
  return INSTAGRAM_USER.test(user) ? `https://www.instagram.com/${user}` : null;
}

/** Texto para mostrar na tela: "@usuario". */
export function instagramHandle(value?: string | null): string {
  const url = instagramUrl(value);
  if (!url) return '';
  const handle = new URL(url).pathname.split('/').filter(Boolean)[0];
  return handle ? `@${handle}` : '';
}

/** Site da empresa com protocolo seguro (nunca javascript:, data: etc.). Vazio se inválido. */
export function websiteUrl(value?: string | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const safe = sanitizeUrl(raw);
  if (!/^https?:\/\//i.test(safe)) return null;
  try {
    return new URL(safe).toString();
  } catch {
    return null;
  }
}

/** Nome do site para mostrar: "exemplo.com.br". */
export function websiteLabel(value?: string | null): string {
  const url = websiteUrl(value);
  if (!url) return '';
  return new URL(url).hostname.replace(/^www\./, '');
}

export function mailtoUrl(value?: string | null): string | null {
  const email = (value ?? '').trim();
  return EMAIL.test(email) ? `mailto:${email}` : null;
}
