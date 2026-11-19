import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type DirectoryResult = Database['public']['Functions']['search_directory']['Returns'][number];

export const MIN_QUERY_LENGTH = 2;
export const PAGE_SIZE = 24;

interface Options {
  query: string;
  /** Categoria exata (ex.: "barbearia"). */
  category?: string | null;
  /** Lista de categorias (ex.: todas as de "serviços"). */
  categories?: string[] | null;
  /** Quantos resultados trazer (aumente para "ver mais"). */
  limit?: number;
}

/**
 * "Bússola": busca no servidor (empresas, produtos e serviços) tolerante a erro de digitação.
 * A busca roda no banco (função `search_directory`), com paginação, e não carrega o catálogo inteiro.
 */
export function useDirectorySearch({ query, category = null, categories = null, limit = PAGE_SIZE }: Options) {
  const term = query.trim();
  return useQuery({
    queryKey: ['directory-search', term, category, categories, limit],
    enabled: term.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async (): Promise<DirectoryResult[]> => {
      const { data, error } = await supabase.rpc('search_directory', {
        _query: term.slice(0, 120),
        _category: category,
        _categories: categories,
        _limit: limit,
        _offset: 0,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
