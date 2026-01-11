import { useState } from "react";
import { MapPin, Grid3X3, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/contexts/LocationContext";

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

interface MobileBottomMenuProps {
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function MobileBottomMenu({ 
  category, 
  onCategoryChange, 
  sortBy, 
  onSortChange 
}: MobileBottomMenuProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { locationDetails, hasPermission } = useUserLocation();

  const locationText = hasPermission && locationDetails 
    ? `${locationDetails.neighborhood || locationDetails.city}` 
    : "Localização";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {/* Localização */}
        <button className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-primary transition-colors">
          <MapPin className="h-5 w-5" />
          <span className="text-xs font-medium truncate max-w-[80px]">{locationText}</span>
        </button>

        {/* Categorias */}
        <Sheet open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <SheetTrigger asChild>
            <button className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
              category !== "todos" ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}>
              <Grid3X3 className="h-5 w-5" />
              <span className="text-xs font-medium">Categorias</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Categorias</SheetTitle>
            </SheetHeader>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[calc(60vh-120px)]">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    onCategoryChange(cat.value);
                    setCategoriesOpen(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Filtros */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <button className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
              sortBy !== "proximity" ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}>
              <SlidersHorizontal className="h-5 w-5" />
              <span className="text-xs font-medium">Filtros</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[40vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Ordenar por</SheetTitle>
            </SheetHeader>
            <div className="space-y-2">
              <Button
                variant={sortBy === "proximity" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onSortChange("proximity");
                  setFiltersOpen(false);
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Mais próximos
              </Button>
              <Button
                variant={sortBy === "name-asc" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onSortChange("name-asc");
                  setFiltersOpen(false);
                }}
              >
                Nome (A-Z)
              </Button>
              <Button
                variant={sortBy === "name-desc" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onSortChange("name-desc");
                  setFiltersOpen(false);
                }}
              >
                Nome (Z-A)
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}