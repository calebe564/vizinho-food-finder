// Fonte única das categorias de estabelecimento.
// Os valores (`value`) precisam bater com o enum `establishment_category` do banco.
// Para criar uma categoria nova: adicione aqui E no enum do banco (migration).

export const CATEGORY_OPTIONS = [
  { value: "restaurante", label: "Restaurante" },
  { value: "lanchonete", label: "Lanchonete" },
  { value: "padaria", label: "Padaria" },
  { value: "supermercado", label: "Supermercado" },
  { value: "açougue", label: "Açougue" },
  { value: "hortifruti", label: "Hortifruti" },
  { value: "pizzaria", label: "Pizzaria" },
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Café" },
  { value: "sorveteria", label: "Sorveteria" },
  { value: "acai", label: "Açaí" },
  { value: "espetinho", label: "Espetinho" },
  { value: "outro", label: "Outro" },
] as const;

export type CategoryOption = { value: string; label: string };

/** Lista para filtros: inclui a opção "todos" no início. */
export function categoriesWithAll(allLabel = "Todas"): CategoryOption[] {
  return [{ value: "todos", label: allLabel }, ...CATEGORY_OPTIONS];
}
