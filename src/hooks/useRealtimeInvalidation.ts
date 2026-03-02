import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global realtime listener that invalidates react-query caches
 * when establishment_photos, establishments, or highlight_requests change.
 * Mount this ONCE at app level.
 */
export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('global-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'establishment_photos' },
        (payload) => {
          const estId = (payload.new as any)?.establishment_id || (payload.old as any)?.establishment_id;
          // Invalidate specific photo queries
          queryClient.invalidateQueries({ queryKey: ['establishment-photos', estId] });
          queryClient.invalidateQueries({ queryKey: ['establishment-main-photo', estId] });
          queryClient.invalidateQueries({ queryKey: ['establishment-main-photos-batch'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'establishments' },
        (payload) => {
          const estId = (payload.new as any)?.id || (payload.old as any)?.id;
          // Invalidate establishment list queries
          queryClient.invalidateQueries({ queryKey: ['establishments'] });
          queryClient.invalidateQueries({ queryKey: ['establishment', estId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'highlight_requests' },
        () => {
          // HeroCarousel will refetch
          queryClient.invalidateQueries({ queryKey: ['highlight-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
