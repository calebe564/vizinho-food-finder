import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocationSuggestion {
  neighborhood: string | null;
  region: string | null;
  city: string;
  displayName: string;
}

export function useAILocationSuggest() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce to avoid too many requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-location-suggest', {
          body: { query }
        });

        if (error) {
          console.error('AI Location Suggest error:', error);
          return;
        }

        setSuggestions(data?.suggestions || []);
      } catch (error) {
        console.error('AI Location Suggest error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    getSuggestions,
    clearSuggestions,
    isLoading,
    suggestions,
  };
}
