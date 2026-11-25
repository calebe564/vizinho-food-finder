import { useQuery } from '@tanstack/react-query';
import { supabaseUntyped } from '@/integrations/supabase/untyped';

export interface LaunchCampaign {
  slug: string;
  name: string;
  is_open: boolean;
  spots_total: number;
  spots_used: number;
  spots_remaining: number;
  promo_price_cents: number;
  promo_months: number;
  plan_name: string;
  regular_price_cents: number;
}

export const LAUNCH_CAMPAIGN_KEY = ['launch-campaign'] as const;

/**
 * Campanha de lançamento com as vagas calculadas pelo banco (adesões reais).
 * Se o banco não responder, devolve null: a tela não mostra campanha nem números inventados.
 */
export function useLaunchCampaign() {
  return useQuery({
    queryKey: LAUNCH_CAMPAIGN_KEY,
    staleTime: 1000 * 60,
    retry: 1,
    queryFn: async (): Promise<LaunchCampaign | null> => {
      const { data, error } = await supabaseUntyped.rpc('get_launch_campaign');
      if (error || !Array.isArray(data) || data.length === 0) return null;
      return data[0] as LaunchCampaign;
    },
  });
}
