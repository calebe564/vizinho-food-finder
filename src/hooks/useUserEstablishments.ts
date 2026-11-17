import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserEstablishment {
  id: string;
  establishment_id: string;
  role: string;
  created_at: string;
  establishment: {
    id: string;
    name: string;
    category: string;
    profile_image: string | null;
    active: boolean;
    address: string;
    phone: string;
  };
}

interface UseUserEstablishmentsReturn {
  establishments: UserEstablishment[];
  isLoading: boolean;
  count: number;
  refetch: () => Promise<void>;
}

export function useUserEstablishments(): UseUserEstablishmentsReturn {
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState<UserEstablishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEstablishments = useCallback(async () => {
    if (!user) {
      setEstablishments([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_establishments')
        .select(`
          id,
          establishment_id,
          role,
          created_at,
          establishments (
            id,
            name,
            category,
            profile_image,
            active,
            address,
            phone
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user establishments:', error);
        setEstablishments([]);
      } else {
        const mapped = (data || [])
          .filter((item) => item.establishments)
          .map((item) => ({
            id: item.id,
            establishment_id: item.establishment_id,
            role: item.role,
            created_at: item.created_at,
            establishment: item.establishments,
          }));
        setEstablishments(mapped);
      }
    } catch (err) {
      console.error('Error in fetchEstablishments:', err);
      setEstablishments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  return {
    establishments,
    isLoading,
    count: establishments.length,
    refetch: fetchEstablishments,
  };
}
