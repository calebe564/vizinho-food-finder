// Fonte única das categorias de estabelecimento (comida, comércio e serviços).
// Os valores (`value`) precisam bater com o enum `establishment_category` do banco
// (há um teste que confere isso). Para criar uma categoria nova: adicione aqui
// E no enum do banco (migration) E em src/integrations/supabase/types.ts.

export type SegmentId = "alimentacao" | "comercio" | "servicos" | "outros";

export interface Segment {
  id: SegmentId;
  label: string;
  description: string;
}

export const SEGMENTS: readonly Segment[] = [
  { id: "alimentacao", label: "Alimentação", description: "Restaurantes, lanchonetes, padarias, bares e mais" },
  { id: "comercio", label: "Comércio", description: "Lojas, mercados, farmácias, pet shops e mais" },
  { id: "servicos", label: "Serviços", description: "Salões, oficinas, saúde, reparos, aulas e mais" },
  { id: "outros", label: "Outros", description: "O que não se encaixa nos demais" },
] as const;

export const CATEGORY_OPTIONS = [
  // Alimentação
  { value: "restaurante", label: "Restaurante", segment: "alimentacao" },
  { value: "lanchonete", label: "Lanchonete", segment: "alimentacao" },
  { value: "padaria", label: "Padaria", segment: "alimentacao" },
  { value: "açougue", label: "Açougue", segment: "alimentacao" },
  { value: "hortifruti", label: "Hortifruti", segment: "alimentacao" },
  { value: "pizzaria", label: "Pizzaria", segment: "alimentacao" },
  { value: "hamburgueria", label: "Hamburgueria", segment: "alimentacao" },
  { value: "bar", label: "Bar", segment: "alimentacao" },
  { value: "cafe", label: "Café", segment: "alimentacao" },
  { value: "sorveteria", label: "Sorveteria", segment: "alimentacao" },
  { value: "acai", label: "Açaí", segment: "alimentacao" },
  { value: "espetinho", label: "Espetinho", segment: "alimentacao" },
  // Comércio
  { value: "supermercado", label: "Supermercado", segment: "comercio" },
  { value: "moda", label: "Moda e Roupas", segment: "comercio" },
  { value: "calcados", label: "Calçados", segment: "comercio" },
  { value: "farmacia", label: "Farmácia", segment: "comercio" },
  { value: "pet_shop", label: "Pet Shop", segment: "comercio" },
  { value: "papelaria", label: "Papelaria e Livraria", segment: "comercio" },
  { value: "eletronicos", label: "Eletrônicos e Celulares", segment: "comercio" },
  { value: "casa_construcao", label: "Casa e Construção", segment: "comercio" },
  { value: "floricultura", label: "Floricultura", segment: "comercio" },
  // Serviços
  { value: "salao_beleza", label: "Salão de Beleza", segment: "servicos" },
  { value: "barbearia", label: "Barbearia", segment: "servicos" },
  { value: "mecanica", label: "Mecânica e Auto", segment: "servicos" },
  { value: "academia", label: "Academia e Esportes", segment: "servicos" },
  { value: "saude", label: "Saúde e Clínicas", segment: "servicos" },
  { value: "educacao", label: "Educação e Cursos", segment: "servicos" },
  { value: "assistencia_tecnica", label: "Assistência Técnica", segment: "servicos" },
  { value: "reparos_manutencao", label: "Reparos e Manutenção", segment: "servicos" },
  { value: "lavanderia", label: "Lavanderia", segment: "servicos" },
  { value: "servicos_profissionais", label: "Serviços Profissionais", segment: "servicos" },
  // Outros
  { value: "outro", label: "Outro", segment: "outros" },
] as const;

export type CategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];

export type CategoryOption = { value: string; label: string; segment?: SegmentId };

/** Mapa valor -> nome para exibição (substitui os mapas copiados em cada tela). */
export const categoryLabels: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label]),
);

/** Nome amigável da categoria; se for desconhecida, devolve o próprio valor. */
export function categoryLabel(value?: string | null): string {
  if (!value) return "";
  return categoryLabels[value] ?? value;
}

export function segmentOf(value?: string | null): SegmentId | null {
  return CATEGORY_OPTIONS.find((c) => c.value === value)?.segment ?? null;
}

export function categoriesInSegment(segment: SegmentId): CategoryOption[] {
  return CATEGORY_OPTIONS.filter((c) => c.segment === segment).map((c) => ({ ...c }));
}

/** Valores de todas as categorias de um segmento (útil para filtrar no banco). */
export function categoryValuesInSegment(segment: SegmentId): string[] {
  return categoriesInSegment(segment).map((c) => c.value);
}

/** Segmentos com suas categorias, para montar listas agrupadas. */
export const CATEGORY_GROUPS = SEGMENTS.map((segment) => ({
  ...segment,
  options: categoriesInSegment(segment.id),
})).filter((g) => g.options.length > 0);

/** Lista para filtros: inclui a opção "todos" no início. */
export function categoriesWithAll(allLabel = "Todas"): CategoryOption[] {
  return [{ value: "todos", label: allLabel }, ...CATEGORY_OPTIONS.map((c) => ({ ...c }))];
}
