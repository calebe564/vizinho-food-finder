import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, X, Search, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserLocation } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";

// Brazilian states
const brazilianStates = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
];

export interface LocationFilter {
  state: string;
  city: string;
  neighborhood: string;
  display: string;
}

interface LocationFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: LocationFilter | null;
  onLocationChange: (location: LocationFilter | null) => void;
}

export function LocationFilterModal({
  open,
  onOpenChange,
  currentLocation,
  onLocationChange,
}: LocationFilterModalProps) {
  const isMobile = useIsMobile();
  const { locationDetails, hasPermission, requestLocation } = useUserLocation();
  
  const [state, setState] = useState(currentLocation?.state || "");
  const [city, setCity] = useState(currentLocation?.city || "");
  const [neighborhood, setNeighborhood] = useState(currentLocation?.neighborhood || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Sync with current location when modal opens
  useEffect(() => {
    if (open) {
      setState(currentLocation?.state || "");
      setCity(currentLocation?.city || "");
      setNeighborhood(currentLocation?.neighborhood || "");
    }
  }, [open, currentLocation]);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    
    if (hasPermission && locationDetails) {
      setState(locationDetails.state || "");
      setCity(locationDetails.city || "");
      setNeighborhood(locationDetails.neighborhood || "");
      setIsLoadingLocation(false);
    } else {
      await requestLocation();
      // Wait a bit for location to be available
      setTimeout(() => {
        if (locationDetails) {
          setState(locationDetails.state || "");
          setCity(locationDetails.city || "");
          setNeighborhood(locationDetails.neighborhood || "");
        }
        setIsLoadingLocation(false);
      }, 1000);
    }
  }, [hasPermission, locationDetails, requestLocation]);

  const handleApply = () => {
    if (!state && !city && !neighborhood) {
      onLocationChange(null);
    } else {
      const parts = [];
      if (neighborhood) parts.push(neighborhood);
      if (city) parts.push(city);
      if (state) parts.push(state);
      
      onLocationChange({
        state,
        city,
        neighborhood,
        display: parts.join(" · "),
      });
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    setState("");
    setCity("");
    setNeighborhood("");
  };

  const handleClearAndClose = () => {
    handleClear();
    onLocationChange(null);
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Use Current Location Button */}
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl gap-2 justify-start"
        onClick={handleUseCurrentLocation}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Navigation className={cn("h-5 w-5", hasPermission && locationDetails && "text-primary")} />
        )}
        <span>
          {hasPermission && locationDetails
            ? "Usar minha localização atual"
            : "Permitir localização"
          }
        </span>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou digite manualmente</span>
        </div>
      </div>

      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="state">Estado</Label>
        <div className="relative">
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Ex: MG, SP, RJ..."
            className="h-12 rounded-xl pr-10"
            list="states-list"
          />
          <datalist id="states-list">
            {brazilianStates.map((s) => (
              <option key={s.uf} value={s.uf}>{s.name}</option>
            ))}
          </datalist>
          {state && (
            <button
              type="button"
              onClick={() => setState("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">Município</Label>
        <div className="relative">
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: Belo Horizonte"
            className="h-12 rounded-xl pr-10"
          />
          {city && (
            <button
              type="button"
              onClick={() => setCity("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Neighborhood */}
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro / Região</Label>
        <div className="relative">
          <Input
            id="neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Ex: Vila Pinho, Barreiro"
            className="h-12 rounded-xl pr-10"
          />
          {neighborhood && (
            <button
              type="button"
              onClick={() => setNeighborhood("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl"
          onClick={handleClearAndClose}
        >
          Limpar
        </Button>
        <Button
          className="flex-1 h-12 rounded-xl"
          onClick={handleApply}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  // Use Sheet on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Filtrar por Local
            </SheetTitle>
            <SheetDescription>
              Busque empresas e produtos em uma localização específica
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Filtrar por Local
          </DialogTitle>
          <DialogDescription>
            Busque empresas e produtos em uma localização específica
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
