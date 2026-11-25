import { useQuery } from '@tanstack/react-query';
import { supabaseUntyped } from '@/integrations/supabase/untyped';
import type { TrackEventType } from '@/lib/tracking';

export interface DailyPoint {
  day: string;
  profile_view: number;
  whatsapp_click: number;
}

export interface MerchantMetrics {
  days: number;
  since: string;
  /** Quando o primeiro evento foi registrado (null se ainda não há nenhum). */
  first_event_at: string | null;
  totals: Partial<Record<TrackEventType, number>>;
  unique_visitors: number;
  daily: DailyPoint[];
  top_products: { id: string; name: string; views: number }[];
}

export type PeriodDays = 7 | 30 | 90;

/**
 * Números reais da empresa, vindos do servidor.
 * Devolve `null` quando o servidor não responde: a tela mostra "indisponível",
 * nunca um zero que pareça verdadeiro.
 */
export function useMerchantMetrics(establishmentId: string | undefined, days: PeriodDays) {
  return useQuery({
    queryKey: ['merchant-metrics', establishmentId ?? 'none', days],
    enabled: !!establishmentId,
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<MerchantMetrics | null> => {
      const { data, error } = await supabaseUntyped.rpc('get_establishment_metrics', {
        _establishment_id: establishmentId,
        _days: days,
      });
      if (error || !data || typeof data !== 'object') return null;
      return data as MerchantMetrics;
    },
  });
}

/** Total de um tipo de evento (0 quando o tipo não aparece no período). */
export function totalOf(metrics: MerchantMetrics, type: TrackEventType): number {
  return metrics.totals[type] ?? 0;
}

/** Soma dos cliques de contato que não são WhatsApp (telefone, site, Instagram, rota). */
export function otherClicks(metrics: MerchantMetrics): number {
  return (['phone_click', 'site_click', 'instagram_click', 'directions_click'] as const).reduce(
    (sum, type) => sum + totalOf(metrics, type),
    0,
  );
}

/** Para o gráfico: altura de cada barra, de 0 a 100, em relação ao maior dia. */
export function barHeights(values: number[]): number[] {
  const max = Math.max(0, ...values);
  if (max === 0) return values.map(() => 0);
  return values.map((v) => (v === 0 ? 0 : Math.max(4, Math.round((v / max) * 100))));
}
