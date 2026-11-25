import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseUntyped } from '@/integrations/supabase/untyped';
import { effectivePrice, type MerchantProduct, type ProductFormValues } from '@/lib/products';

const KEY = (establishmentId: string | undefined) => ['merchant-products', establishmentId ?? 'none'] as const;

const COLUMNS =
  'id, name, description, price, image, unit, category, is_available, is_promotion, promotion_description, promotion_expiration, created_at, product_variations(id, name, price)';

/** Mensagem para a pessoa: o limite do plano vem pronta do banco; o resto é genérico. */
export function productErrorMessage(error: { message?: string; code?: string } | null | undefined, fallback: string): string {
  const message = error?.message ?? '';
  if (/^Limite de \d+ produtos/.test(message)) return message;
  if (error?.code === '42501' || /row-level security/i.test(message)) return 'Você não tem permissão para alterar os produtos desta empresa.';
  return fallback;
}

export function useMerchantProducts(establishmentId: string | undefined) {
  return useQuery({
    queryKey: KEY(establishmentId),
    enabled: !!establishmentId,
    queryFn: async (): Promise<MerchantProduct[]> => {
      const { data, error } = await supabaseUntyped
        .from('products')
        .select(COLUMNS)
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MerchantProduct[];
    },
  });
}

interface SaveInput {
  values: ProductFormValues;
  imageUrl: string | null;
  existing?: MerchantProduct | null;
}

export function useSaveProduct(establishmentId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ values, imageUrl, existing }: SaveInput) => {
      if (!establishmentId) throw new Error('Selecione uma empresa.');

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        category: values.category?.trim() || null,
        price: effectivePrice(values),
        image: imageUrl,
        is_available: values.is_available,
      };

      let productId = existing?.id;
      if (existing) {
        const { error } = await supabaseUntyped.from('products').update(payload).eq('id', existing.id);
        if (error) throw new Error(productErrorMessage(error, 'Não foi possível salvar o produto.'));
      } else {
        const { data, error } = await supabaseUntyped
          .from('products')
          .insert({ ...payload, establishment_id: establishmentId })
          .select('id')
          .single();
        if (error) throw new Error(productErrorMessage(error, 'Não foi possível cadastrar o produto.'));
        productId = (data as { id: string }).id;
      }

      // Variações: grava as novas primeiro e só depois apaga as antigas, para nunca perder dados se algo falhar.
      const oldIds = (existing?.product_variations ?? []).map((v) => v.id).filter((id): id is string => !!id);
      const newVariations = values.hasVariations ? (values.variations ?? []) : [];
      if (newVariations.length > 0) {
        const { error } = await supabaseUntyped
          .from('product_variations')
          .insert(newVariations.map((v) => ({ product_id: productId, name: v.name.trim(), price: v.price })));
        if (error) throw new Error('O produto foi salvo, mas as variações não. Edite o produto e tente de novo.');
      }
      if (oldIds.length > 0) {
        await supabaseUntyped.from('product_variations').delete().in('id', oldIds);
      }
      return productId;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId) }),
  });
}

export function useDeleteProduct(establishmentId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await supabaseUntyped.from('product_variations').delete().eq('product_id', productId);
      const { error } = await supabaseUntyped.from('products').delete().eq('id', productId);
      if (error) throw new Error(productErrorMessage(error, 'Não foi possível excluir o produto.'));
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId) }),
  });
}

export function useToggleAvailability(establishmentId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, available }: { productId: string; available: boolean }) => {
      const { error } = await supabaseUntyped.from('products').update({ is_available: available }).eq('id', productId);
      if (error) throw new Error(productErrorMessage(error, 'Não foi possível atualizar a disponibilidade.'));
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY(establishmentId) }),
  });
}
