import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseUntyped } from '@/integrations/supabase/untyped';
import { isValidHex, type CornerStyle, type MerchantThemeInput } from '@/lib/themeColors';

export interface EstablishmentThemeRow {
  establishment_id: string;
  primary_color: string | null;
  secondary_color: string | null;
  corner_style: CornerStyle;
}

const KEY = (establishmentId: string | undefined) => ['establishment-theme', establishmentId ?? 'none'] as const;

/** Linha do tema -> formato do motor de cores. */
export function toThemeInput(row: EstablishmentThemeRow | null | undefined): MerchantThemeInput {
  return {
    primary: row?.primary_color ?? null,
    secondary: row?.secondary_color ?? null,
    radius: row?.corner_style ?? null,
  };
}

/** Tema da empresa (público). Sem tema, ou se o banco não responder, devolve null = tema padrão do site. */
export function useEstablishmentTheme(establishmentId: string | undefined) {
  return useQuery({
    queryKey: KEY(establishmentId),
    enabled: !!establishmentId,
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<EstablishmentThemeRow | null> => {
      const { data, error } = await supabaseUntyped
        .from('establishment_themes')
        .select('establishment_id, primary_color, secondary_color, corner_style')
        .eq('establishment_id', establishmentId)
        .maybeSingle();
      if (error || !data) return null;
      return data as EstablishmentThemeRow;
    },
  });
}

/** Mensagem para a pessoa: as do plano vêm prontas do banco; o resto é genérico. */
export function themeErrorMessage(error: { message?: string } | null | undefined): string {
  const m = error?.message ?? '';
  if (/personalização visual|plano Max/.test(m)) return m;
  return 'Não foi possível salvar a aparência agora. Tente novamente.';
}

export function useSaveTheme(establishmentId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { primary: string | null; secondary: string | null; corner: CornerStyle }) => {
      if (!establishmentId) throw new Error('Selecione uma empresa.');
      if (input.primary && !isValidHex(input.primary)) throw new Error('Cor principal inválida.');
      if (input.secondary && !isValidHex(input.secondary)) throw new Error('Cor secundária inválida.');
      const { error } = await supabaseUntyped.from('establishment_themes').upsert(
        {
          establishment_id: establishmentId,
          primary_color: input.primary ? input.primary.toUpperCase() : null,
          secondary_color: input.secondary ? input.secondary.toUpperCase() : null,
          corner_style: input.corner,
        },
        { onConflict: 'establishment_id' },
      );
      if (error) throw new Error(themeErrorMessage(error));
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId) }),
  });
}

/** Volta ao tema padrão do site. */
export function useResetTheme(establishmentId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!establishmentId) throw new Error('Selecione uma empresa.');
      const { error } = await supabaseUntyped.from('establishment_themes').delete().eq('establishment_id', establishmentId);
      if (error) throw new Error('Não foi possível voltar ao tema padrão agora. Tente novamente.');
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId) }),
  });
}
