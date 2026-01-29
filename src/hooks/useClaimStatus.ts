import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClaimStatus {
  hasPendingClaim: boolean;
  hasApprovedClaim: boolean;
  claimId: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useClaimStatus(): ClaimStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<ClaimStatus>({
    hasPendingClaim: false,
    hasApprovedClaim: false,
    claimId: null,
    loading: true,
    refetch: async () => {},
  });

  const fetchClaimStatus = useCallback(async () => {
    if (!user) {
      setStatus(prev => ({
        ...prev,
        hasPendingClaim: false,
        hasApprovedClaim: false,
        claimId: null,
        loading: false,
      }));
      return;
    }

    try {
      // Check for pending claim
      const { data: pendingClaim } = await supabase
        .from('establishment_claims')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      // Check for approved claim
      const { data: approvedClaim } = await supabase
        .from('establishment_claims')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      setStatus(prev => ({
        ...prev,
        hasPendingClaim: !!pendingClaim,
        hasApprovedClaim: !!approvedClaim,
        claimId: pendingClaim?.id || approvedClaim?.id || null,
        loading: false,
      }));
    } catch (err) {
      console.error('Error fetching claim status:', err);
      setStatus(prev => ({
        ...prev,
        hasPendingClaim: false,
        hasApprovedClaim: false,
        claimId: null,
        loading: false,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchClaimStatus();
  }, [fetchClaimStatus]);

  return {
    ...status,
    refetch: fetchClaimStatus,
  };
}
