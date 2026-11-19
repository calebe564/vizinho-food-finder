import { SelectGroup, SelectItem, SelectLabel } from "@/components/ui/select";
import { CATEGORY_GROUPS } from "@/config/categories";

interface CategorySelectItemsProps {
  /** Se informado, adiciona no topo a opção "todos" com este texto. */
  allLabel?: string;
  /** Valor da opção "todos" (padrão: "todos"). */
  allValue?: string;
  itemClassName?: string;
}

/** Itens de um <SelectContent> com as categorias agrupadas por segmento. */
export function CategorySelectItems({ allLabel, allValue = "todos", itemClassName }: CategorySelectItemsProps) {
  return (
    <>
      {allLabel && (
        <SelectItem value={allValue} className={itemClassName}>
          {allLabel}
        </SelectItem>
      )}
      {CATEGORY_GROUPS.map((group) => (
        <SelectGroup key={group.id}>
          <SelectLabel>{group.label}</SelectLabel>
          {group.options.map((option) => (
            <SelectItem key={option.value} value={option.value} className={itemClassName}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}
