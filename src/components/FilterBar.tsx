import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = [
  { value: "todos", label: "Todas as categorias" },
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
  { value: "outro", label: "Outro" },
];

const sortOptions = [
  { value: "distance", label: "Distância" },
  { value: "name", label: "Nome (A-Z)" },
  { value: "price-asc", label: "Preço (menor)" },
  { value: "price-desc", label: "Preço (maior)" },
];

interface FilterBarProps {
  category?: string;
  onCategoryChange?: (value: string) => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
}

export function FilterBar({ 
  category, 
  onCategoryChange, 
  sortBy, 
  onSortChange 
}: FilterBarProps) {
  const actualCategory = category || "todos";
  const actualSortBy = sortBy || "distance";
  
  const handleCategoryChange = (value: string) => {
    if (onCategoryChange) onCategoryChange(value);
  };
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select value={actualCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onSortChange && (
        <Select value={actualSortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
