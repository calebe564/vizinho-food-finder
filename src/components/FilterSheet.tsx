import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, MapPin, Navigation, Check } from "lucide-react";
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

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
      {/* Inline filter buttons - matching the reference design */}
      
      {/* Categoria button - opens sheet */}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <button
            className={`flex items-center gap-1.5 px-3 h-8 md:h-10 md:px-4 rounded-full text-xs md:text-sm font-medium transition-all flex-shrink-0 border ${
              category !== "todos"
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary text-foreground border-border hover:border-primary/30"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>Categoria</span>
            {category !== "todos" && (
              <>
                <span className="text-border">|</span>
                <span className="text-primary">{categories.find(c => c.value === category)?.label}</span>
              </>
            )}
          </button>
        </SheetTrigger>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={`${isMobile ? "h-[70vh] max-h-[70vh] rounded-t-3xl" : "w-[400px]"} p-0 flex flex-col`}
        >
          <SheetHeader className="p-4 md:p-6 border-b border-border flex-shrink-0">
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
                        ? "bg-accent text-accent-foreground shadow-button"
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
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
                        ? "bg-accent text-accent-foreground shadow-button"
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
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

          {/* Apply Button - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 md:p-6 border-t border-border bg-card safe-area-bottom">
            <Button onClick={handleApply} className="w-full h-12 rounded-xl font-semibold shadow-button bg-accent hover:bg-accent/90">
              Aplicar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mais Próximos button */}
      <button
        onClick={() => onSortChange(sortBy === "proximity" ? "name-asc" : "proximity")}
        className={`flex items-center gap-1.5 px-3 h-8 md:h-10 md:px-4 rounded-full text-xs md:text-sm font-medium transition-all flex-shrink-0 border ${
          sortBy === "proximity"
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-secondary text-foreground border-border hover:border-primary/30"
        }`}
      >
        <Navigation className="h-3.5 w-3.5 md:h-4 md:w-4" />
        <span>Próximos</span>
      </button>

      {/* Localização button */}
      <button
        className="flex items-center gap-1.5 px-3 h-8 md:h-10 md:px-4 rounded-full text-xs md:text-sm font-medium transition-all flex-shrink-0 border bg-secondary text-foreground border-border hover:border-primary/30"
      >
        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
        <span>Local</span>
      </button>
    </div>
  );
}
