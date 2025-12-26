import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'pending_changes';

interface EstablishmentRequest {
  id: string;
  name: string;
  status: RequestStatus;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface UseEstablishmentRequestReturn {
  request: EstablishmentRequest | null;
  isLoading: boolean;
  hasPendingRequest: boolean;
  hasApprovedRequest: boolean;
  refetch: () => Promise<void>;
}

export function useEstablishmentRequest(): UseEstablishmentRequestReturn {
  const { user } = useAuth();
  const [request, setRequest] = useState<EstablishmentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequest = useCallback(async () => {
    if (!user) {
      setRequest(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('establishment_requests')
        .select('id, name, status, created_at, approved_at, rejected_at, rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching establishment request:', error);
        setRequest(null);
      } else if (data) {
        setRequest({
          id: data.id,
          name: data.name,
          status: (data.status as RequestStatus) || 'pending',
          created_at: data.created_at || '',
          approved_at: data.approved_at || undefined,
          rejected_at: data.rejected_at || undefined,
          rejection_reason: data.rejection_reason || undefined,
        });
      } else {
        setRequest(null);
      }
    } catch (err) {
      console.error('Error in fetchRequest:', err);
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const hasPendingRequest = request?.status === 'pending' || request?.status === 'pending_changes';
  const hasApprovedRequest = request?.status === 'approved';

  return {
    request,
    isLoading,
    hasPendingRequest,
    hasApprovedRequest,
    refetch: fetchRequest,
  };
}
