import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface LocationSuggestion {
  neighborhood: string | null;
  region: string | null;
  city: string;
  displayName: string;
}

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  locationValue?: string;
  onLocationChange?: (value: string) => void;
  onLocationSelect?: (location: LocationSuggestion) => void;
  showLocation?: boolean;
  isSearching?: boolean;
}

export function SearchBar({ 
  value, 
  onChange, 
  onSearch,
  locationValue,
  onLocationChange,
  showLocation = false,
  isSearching = false
}: SearchBarProps) {
  const handleChange = (newValue: string) => {
    if (onChange) onChange(newValue);
    if (onSearch) onSearch(newValue);
  };

  const handleLocationInputChange = (newValue: string) => {
    if (onLocationChange) onLocationChange(newValue);
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        {isSearching ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        )}
        <Input
          type="text"
          placeholder="Buscar por produto, empresa ou categoria..."
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-12 h-14 text-base rounded-2xl border-2 border-transparent bg-secondary/50 focus:border-primary focus:bg-background transition-all"
        />
        {value && (
          <button
            onClick={() => handleChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {showLocation && (
        <div className="relative sm:w-[280px]">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Bairro / Cidade"
            value={locationValue || ""}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            className="pl-12 h-14 text-base rounded-2xl border-2 border-transparent bg-secondary/50 focus:border-primary focus:bg-background transition-all"
          />
        </div>
      )}
    </div>
  );
}
