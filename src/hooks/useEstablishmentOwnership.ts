import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OwnershipStatus {
  hasOwner: boolean;
  isOwner: boolean;
  ownerId: string | null;
  loading: boolean;
}

export function useEstablishmentOwnership(establishmentId: string | undefined): OwnershipStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<OwnershipStatus>({
    hasOwner: false,
    isOwner: false,
    ownerId: null,
    loading: true,
  });

  const checkOwnership = useCallback(async () => {
    if (!establishmentId) {
      setStatus({ hasOwner: false, isOwner: false, ownerId: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_establishments')
        .select('user_id')
        .eq('establishment_id', establishmentId)
        .eq('role', 'owner')
        .maybeSingle();

      if (error) throw error;

      setStatus({
        hasOwner: !!data,
        isOwner: data ? data.user_id === user?.id : false,
        ownerId: data?.user_id || null,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking ownership:', err);
      setStatus({ hasOwner: false, isOwner: false, ownerId: null, loading: false });
    }
  }, [establishmentId, user?.id]);

  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  return status;
}
