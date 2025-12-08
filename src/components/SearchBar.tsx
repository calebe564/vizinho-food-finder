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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por produto, empresa ou categoria..."
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>
      
      {showLocation && (
        <div className="relative sm:w-[250px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Bairro / Cidade (opcional)"
            value={locationValue || ""}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      )}
    </div>
  );
}
