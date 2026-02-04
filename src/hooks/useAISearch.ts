import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductSearchResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  unit: string | null;
  establishment: {
    id: string;
    name: string;
    neighborhood: string | null;
    region: string | null;
    city: string;
    profileImage: string | null;
    category: string;
    schedule?: string;
    hasDelivery?: boolean;
    phone?: string;
    whatsapp?: string | null;
    address?: string;
    googleMapsLink?: string | null;
    cnpj?: string | null;
  } | null;
}

export interface EstablishmentSearchResult {
  id: string;
  name: string;
  neighborhood: string | null;
  region: string | null;
  city: string;
  profileImage: string | null;
  category: string;
  description: string | null;
}

export interface AISearchResults {
  products: ProductSearchResult[];
  establishments: EstablishmentSearchResult[];
  correctedQuery: string | null;
  searchType: string;
}

export function useAISearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AISearchResults | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (query: string, location?: string) => {
    if (!query || query.trim().length === 0) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query, location }
      });

      if (error) {
        console.error('AI Search error:', error);
        toast({
          title: 'Erro na busca',
          description: 'Não foi possível realizar a busca. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setResults(data);
    } catch (error) {
      console.error('AI Search error:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível realizar a busca. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    search,
    clearResults,
    isLoading,
    results,
  };
}
