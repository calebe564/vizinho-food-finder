import { supabaseUntyped } from '@/integrations/supabase/untyped';

// Registro de visitas e cliques das páginas públicas.
//  * Quem registra é o servidor (função track_event), que ignora o dono e a equipe,
//    não conta recarregamentos e limita o volume. O navegador só avisa.
//  * Nenhum dado pessoal: o identificador é um número aleatório que vale só enquanto a aba
//    estiver aberta, e o endereço de rede não é gravado.
//  * Falha em silêncio: estatística nunca pode atrapalhar quem está navegando.

export type TrackEventType =
  | 'profile_view'
  | 'product_view'
  | 'whatsapp_click'
  | 'phone_click'
  | 'site_click'
  | 'instagram_click'
  | 'directions_click';

const SESSION_KEY = 'cv_session';
const SENT_KEY = 'cv_sent';
const VIEW_TTL_MS = 30 * 60 * 1000; // mesma janela do servidor

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function sessionStore(): Store | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  (globalThis.crypto ?? { getRandomValues: (b: Uint8Array) => b.map(() => Math.floor(Math.random() * 256)) }).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Identificador aleatório da aba (some quando a aba fecha). */
export function getSessionId(store: Store | null = sessionStore()): string {
  try {
    const existing = store?.getItem(SESSION_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const created = randomId();
    store?.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

/** Robôs e navegadores automatizados não contam como visita. */
export function isLikelyBot(nav: Pick<Navigator, 'userAgent'> & { webdriver?: boolean } = typeof navigator !== 'undefined' ? navigator : { userAgent: '' }): boolean {
  if (nav.webdriver) return true;
  return /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i.test(nav.userAgent ?? '');
}

/** O mesmo item na mesma aba só é enviado de novo depois de 30 min (cliques sempre passam; o servidor limita). */
export function shouldSend(type: TrackEventType, targetKey: string, store: Store | null, now = Date.now()): boolean {
  if (type !== 'profile_view' && type !== 'product_view') return true;
  try {
    const sent: Record<string, number> = JSON.parse(store?.getItem(SENT_KEY) ?? '{}');
    const key = `${type}:${targetKey}`;
    if (sent[key] && now - sent[key] < VIEW_TTL_MS) return false;
    sent[key] = now;
    // guarda só os recentes, para o objeto não crescer
    for (const k of Object.keys(sent)) if (now - sent[k] > VIEW_TTL_MS) delete sent[k];
    store?.setItem(SENT_KEY, JSON.stringify(sent));
  } catch {
    // sem armazenamento: deixa o servidor decidir
  }
  return true;
}

export interface TrackInput {
  establishmentId: string | undefined;
  type: TrackEventType;
  productId?: string;
}

export function trackEvent({ establishmentId, type, productId }: TrackInput): void {
  if (!establishmentId || isLikelyBot()) return;
  const store = sessionStore();
  if (!shouldSend(type, productId ?? establishmentId, store)) return;

  void Promise.resolve(
    supabaseUntyped.rpc('track_event', {
      _establishment_id: establishmentId,
      _event_type: type,
      _product_id: productId ?? null,
      _session_id: getSessionId(store),
    }),
  ).catch(() => {
    // estatística não pode quebrar a página
  });
}
