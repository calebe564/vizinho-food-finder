import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, MapPin, Clock, Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const categories = [
  { value: "todos", label: "Todas" },
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
];

const sortOptions = [
  { value: "proximity", label: "Mais próximos", icon: MapPin },
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
];

interface FilterSheetProps {
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function FilterSheet({ category, onCategoryChange, sortBy, onSortChange }: FilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState(category);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const isMobile = useIsMobile();
  
  const activeFiltersCount = (category !== "todos" ? 1 : 0) + (sortBy !== "proximity" ? 1 : 0);

  const handleApply = () => {
    onCategoryChange(tempCategory);
    onSortChange(tempSortBy);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempCategory("todos");
    setTempSortBy("proximity");
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempCategory(category);
      setTempSortBy(sortBy);
    }
    setIsOpen(open);
  };

  // Quick filter chips for mobile
  const quickFilters = [
    { label: "Categoria", active: category !== "todos", value: category !== "todos" ? categories.find(c => c.value === category)?.label : null },
    { label: "Mais próximos", active: sortBy === "proximity", icon: MapPin },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
      {/* Main Filter Button */}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant={activeFiltersCount > 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full h-10 px-4 gap-2 flex-shrink-0 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={`${isMobile ? "h-[85vh] rounded-t-3xl" : "w-[400px]"} p-0`}
        >
          <SheetHeader className="p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">Filtros</SheetTitle>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                Limpar
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Categoria</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setTempCategory(cat.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      tempCategory === cat.value
                        ? "bg-primary text-primary-foreground shadow-button"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Ordenar por</h3>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTempSortBy(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      tempSortBy === option.value
                        ? "bg-primary text-primary-foreground shadow-button"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && <option.icon className="h-4 w-4" />}
                      {option.label}
                    </div>
                    {tempSortBy === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="p-4 md:p-6 border-t border-border/50 bg-card">
            <Button onClick={handleApply} className="w-full h-12 rounded-xl font-semibold shadow-button">
              Aplicar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick filter chips */}
      <button
        onClick={() => onCategoryChange(category === "todos" ? "todos" : "todos")}
        className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-sm font-medium transition-all flex-shrink-0 border ${
          category !== "todos"
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Categoria</span>
        {category !== "todos" && (
          <Badge variant="secondary" className="ml-1 text-xs py-0 h-5">
            {categories.find(c => c.value === category)?.label}
          </Badge>
        )}
      </button>

      <button
        onClick={() => onSortChange(sortBy === "proximity" ? "name-asc" : "proximity")}
        className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-sm font-medium transition-all flex-shrink-0 border ${
          sortBy === "proximity"
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
        }`}
      >
        <MapPin className="h-3.5 w-3.5" />
        <span>Mais Próximos</span>
      </button>
    </div>
  );
}
