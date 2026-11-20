import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseUntyped } from '@/integrations/supabase/untyped';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionStatus = 'pending' | 'active' | 'rejected' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  establishment_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  wants_launch_offer: boolean;
  campaign_id: string | null;
  price_cents: number | null;
  promo_ends_at: string | null;
  note: string | null;
  created_at: string;
}

const KEY = (establishmentId: string) => ['subscriptions', establishmentId] as const;

/** Assinaturas da empresa (ativa, pendente e histórico recente). O banco só entrega ao dono. */
export function useEstablishmentSubscriptions(establishmentId: string | undefined) {
  return useQuery({
    queryKey: KEY(establishmentId ?? 'none'),
    enabled: !!establishmentId,
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabaseUntyped
        .from('subscriptions')
        .select('id, establishment_id, plan_name, status, wants_launch_offer, campaign_id, price_cents, promo_ends_at, note, created_at')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
  });
}

/** O dono só PEDE um plano; quem ativa é a equipe (não há cobrança automática ainda). */
export function useRequestPlan(establishmentId: string | undefined) {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planName: string; wantsLaunchOffer: boolean }) => {
      if (!user || !establishmentId) throw new Error('Entre na sua conta e escolha uma empresa.');
      const { error } = await supabaseUntyped.from('subscriptions').insert({
        establishment_id: establishmentId,
        plan_name: input.planName,
        wants_launch_offer: input.wantsLaunchOffer,
        requested_by: user.id,
      });
      if (error) {
        if (error.code === '23505') throw new Error('Já existe uma solicitação pendente para esta empresa.');
        throw new Error('Não foi possível enviar a solicitação. Tente novamente.');
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId ?? 'none') }),
  });
}

export function useWithdrawRequest(establishmentId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabaseUntyped.from('subscriptions').delete().eq('id', subscriptionId);
      if (error) throw new Error('Não foi possível cancelar a solicitação.');
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId ?? 'none') }),
  });
}
