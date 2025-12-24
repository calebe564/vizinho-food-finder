import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAILocationSuggest, type LocationSuggestion } from "@/hooks/useAILocationSuggest";

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
  onLocationSelect,
  showLocation = false,
  isSearching = false
}: SearchBarProps) {
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const { getSuggestions, suggestions, isLoading: isLoadingLocations, clearSuggestions } = useAILocationSuggest();

  const handleChange = (newValue: string) => {
    if (onChange) onChange(newValue);
    if (onSearch) onSearch(newValue);
  };

  const handleLocationInputChange = (newValue: string) => {
    if (onLocationChange) onLocationChange(newValue);
    if (newValue.length >= 2) {
      getSuggestions(newValue);
      setShowLocationSuggestions(true);
    } else {
      clearSuggestions();
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    if (onLocationChange) onLocationChange(suggestion.displayName);
    if (onLocationSelect) onLocationSelect(suggestion);
    setShowLocationSuggestions(false);
    clearSuggestions();
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
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
        <div className="relative sm:w-[280px]" ref={locationRef}>
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Bairro / Cidade"
            value={locationValue || ""}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowLocationSuggestions(true)}
            className="pl-12 h-14 text-base rounded-2xl border-2 border-transparent bg-secondary/50 focus:border-primary focus:bg-background transition-all"
          />
          {isLoadingLocations && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
          )}
          
          {/* AI Location Suggestions Dropdown */}
          {showLocationSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{suggestion.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
