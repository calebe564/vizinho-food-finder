import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Cliente sem os tipos gerados. Usado para tabelas e funções novas (planos, assinaturas,
 * campanha) enquanto o arquivo `types.ts` (gerado pela Lovable) não as inclui. Cada hook
 * declara o formato do que lê. Não edite o `types.ts` à mão: a Lovable o regenera.
 */
export const supabaseUntyped = supabase as unknown as SupabaseClient;
