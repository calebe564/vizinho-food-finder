import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  locationValue?: string;
  onLocationChange?: (value: string) => void;
  showLocation?: boolean;
}

export function SearchBar({ 
  value, 
  onChange, 
  onSearch,
  locationValue,
  onLocationChange,
  showLocation = false
}: SearchBarProps) {
  const handleChange = (newValue: string) => {
    if (onChange) onChange(newValue);
    if (onSearch) onSearch(newValue);
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por produto, empresa ou categoria..."
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-12 h-14 text-base rounded-2xl border-2 border-transparent bg-secondary/50 focus:border-primary focus:bg-background transition-all"
        />
      </div>
      
      {showLocation && (
        <div className="relative sm:w-[280px]">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Bairro / Cidade (opcional)"
            value={locationValue || ""}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className="pl-12 h-14 text-base rounded-2xl border-2 border-transparent bg-secondary/50 focus:border-primary focus:bg-background transition-all"
          />
        </div>
      )}
    </div>
  );
}
