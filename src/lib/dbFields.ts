// Leitura tipada de colunas que existem no banco mas não aparecem nos tipos locais
// de algumas telas (avaliação e promoção). Evita espalhar `as any` pelo código.

type RatingFields = { rating_average?: number | null; rating_count?: number | null };
type PromoFields = {
  is_promotion?: boolean | null;
  promotion_description?: string | null;
  promotion_expiration?: string | null;
};

export function ratingOf(entity: object | null | undefined): { average: number; count: number } {
  const r = (entity ?? {}) as RatingFields;
  return { average: r.rating_average ?? 0, count: r.rating_count ?? 0 };
}

export function promoOf(product: object | null | undefined): {
  isPromotion: boolean;
  description: string | null;
  expiration: string | null;
  /** Marcada como promoção, mas com a data de validade já vencida. */
  expired: boolean;
  /** Promoção ativa: marcada como promoção e ainda não expirada. */
  isActive: boolean;
} {
  const p = (product ?? {}) as PromoFields;
  const expired = !!p.promotion_expiration && new Date(p.promotion_expiration) < new Date();
  return {
    isPromotion: !!p.is_promotion,
    description: p.promotion_description ?? null,
    expiration: p.promotion_expiration ?? null,
    expired: !!p.is_promotion && expired,
    isActive: !!p.is_promotion && !expired,
  };
}
