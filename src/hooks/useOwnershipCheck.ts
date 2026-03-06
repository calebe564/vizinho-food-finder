import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OwnershipCheck {
  hasEstablishment: boolean;
  hasPendingRequest: boolean;
  hasPendingClaim: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useOwnershipCheck(): OwnershipCheck {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<OwnershipCheck, 'refetch'>>({
    hasEstablishment: false,
    hasPendingRequest: false,
    hasPendingClaim: false,
    isBlocked: false,
    blockReason: null,
    isLoading: true,
  });

  const check = useCallback(async () => {
    if (!user) {
      setState({
        hasEstablishment: false,
        hasPendingRequest: false,
        hasPendingClaim: false,
        isBlocked: false,
        blockReason: null,
        isLoading: false,
      });
      return;
    }

    try {
      // Check all in parallel
      const [estResult, reqResult, claimResult] = await Promise.all([
        supabase
          .from('user_establishments')
          .select('id')
          .eq('user_id', user.id)
          .limit(1),
        supabase
          .from('establishment_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1),
        supabase
          .from('establishment_claims')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1),
      ]);

      const hasEst = (estResult.data?.length ?? 0) > 0;
      const hasPendReq = (reqResult.data?.length ?? 0) > 0;
      const hasPendClaim = (claimResult.data?.length ?? 0) > 0;
      const isBlocked = hasEst || hasPendReq || hasPendClaim;

      let blockReason: string | null = null;
      if (hasEst) {
        blockReason = 'Você já possui uma empresa cadastrada.\n\nNo Comércio Vizinho cada conta pode gerenciar apenas uma empresa.\n\nCaso precise atualizar informações da sua empresa, utilize o painel de gerenciamento.';
      } else if (hasPendReq) {
        blockReason = 'Você já possui uma solicitação de empresa em análise.\n\nAguarde a aprovação do administrador antes de realizar novas solicitações.';
      } else if (hasPendClaim) {
        blockReason = 'Você já possui uma reivindicação de empresa em análise.\n\nAguarde a aprovação do administrador antes de realizar novas solicitações.';
      }

      setState({
        hasEstablishment: hasEst,
        hasPendingRequest: hasPendReq,
        hasPendingClaim: hasPendClaim,
        isBlocked,
        blockReason,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error in ownership check:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  return { ...state, refetch: check };
}
