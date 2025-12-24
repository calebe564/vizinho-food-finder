import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

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
  { value: "proximity", label: "Mais próximos" },
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
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
  const actualSortBy = sortBy || "proximity";
  
  const handleCategoryChange = (value: string) => {
    if (onCategoryChange) onCategoryChange(value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 sm:flex-none">
        <Select value={actualCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[240px] h-12 rounded-xl bg-secondary/50 border-0">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onSortChange && (
        <div className="relative flex-1 sm:flex-none">
          <Select value={actualSortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl bg-secondary/50 border-0">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Ordenar por" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
