import * as z from 'zod';

export const PRODUCT_LIMITS = {
  name: 80,
  description: 500,
  category: 60,
  variations: 10,
  variationName: 40,
  maxPrice: 100_000,
} as const;

export const variationSchema = z.object({
  name: z.string().trim().min(1, 'Nome da variação obrigatório').max(PRODUCT_LIMITS.variationName, 'Nome da variação muito longo'),
  price: z.number({ invalid_type_error: 'Informe o preço' }).min(0.01, 'Preço deve ser maior que 0').max(PRODUCT_LIMITS.maxPrice, 'Preço muito alto'),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome muito curto').max(PRODUCT_LIMITS.name, 'Nome muito longo'),
    description: z.string().trim().max(PRODUCT_LIMITS.description, `Use no máximo ${PRODUCT_LIMITS.description} caracteres`).optional(),
    category: z.string().trim().max(PRODUCT_LIMITS.category, 'Categoria muito longa').optional(),
    price: z.number({ invalid_type_error: 'Informe o preço' }).min(0, 'Preço inválido').max(PRODUCT_LIMITS.maxPrice, 'Preço muito alto'),
    is_available: z.boolean(),
    hasVariations: z.boolean(),
    variations: z.array(variationSchema).max(PRODUCT_LIMITS.variations, `No máximo ${PRODUCT_LIMITS.variations} variações`).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasVariations) {
      if (!data.variations || data.variations.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variations'], message: 'Adicione pelo menos uma variação' });
      }
    } else if (data.price < 0.01) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Preço deve ser maior que 0' });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductVariation {
  id?: string;
  name: string;
  price: number;
}

/** Produto como a área do comerciante enxerga (linha da tabela products + variações). */
export interface MerchantProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  unit: string | null;
  category: string | null;
  is_available: boolean;
  is_promotion: boolean;
  promotion_description: string | null;
  promotion_expiration: string | null;
  created_at: string | null;
  product_variations: ProductVariation[] | null;
}

/**
 * Preço que vai para a coluna `price` (obrigatória). Com variações, usa a mais barata:
 * é o "a partir de" que a vitrine mostra.
 */
export function effectivePrice(values: Pick<ProductFormValues, 'price' | 'hasVariations' | 'variations'>): number {
  if (values.hasVariations && values.variations && values.variations.length > 0) {
    return Math.min(...values.variations.map((v) => v.price));
  }
  return values.price;
}

/** Valores iniciais do formulário a partir de um produto existente (ou vazio, se for novo). */
export function toFormValues(product?: MerchantProduct | null): ProductFormValues {
  const variations = (product?.product_variations ?? []).map((v) => ({ name: v.name, price: Number(v.price) }));
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    price: variations.length > 0 ? 0 : Number(product?.price ?? 0),
    is_available: product?.is_available ?? true,
    hasVariations: variations.length > 0,
    variations,
  };
}

/** Texto de preço para a lista: "R$ 10,00" ou "a partir de R$ 8,00" quando há variações. */
export function priceLabel(product: Pick<MerchantProduct, 'price' | 'product_variations'>): string {
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const variations = product.product_variations ?? [];
  if (variations.length > 0) return `a partir de ${fmt(Math.min(...variations.map((v) => Number(v.price))))}`;
  return fmt(Number(product.price));
}

/** Categorias já usadas pela empresa, para sugerir ao cadastrar um produto novo. */
export function existingCategories(products: Pick<MerchantProduct, 'category'>[]): string[] {
  return [...new Set(products.map((p) => p.category?.trim()).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
