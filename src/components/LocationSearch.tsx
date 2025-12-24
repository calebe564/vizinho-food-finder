import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";

interface LocationSuggestion {
  display: string;
  neighborhood: string;
  region: string;
  city: string;
  state: string;
}

interface LocationSearchProps {
  onLocationSelect?: (location: LocationSuggestion | null) => void;
  className?: string;
}

export function LocationSearch({ onLocationSelect, className }: LocationSearchProps) {
  const { 
    locationDetails, 
    hasPermission, 
    isLoading: locationLoading,
    requestLocation,
    manualLocation,
    setManualLocation
  } = useUserLocation();
  
  const [inputValue, setInputValue] = useState(manualLocation);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format display string from location details
  const formatLocationDisplay = (details: { neighborhood?: string; region?: string; city?: string; state?: string }) => {
    const parts = [];
    if (details.neighborhood) parts.push(details.neighborhood);
    if (details.region && details.region !== details.neighborhood) parts.push(details.region);
    if (details.city) parts.push(details.city);
    if (details.state) parts.push(details.state);
    return parts.join(" - ");
  };

  // Set initial value from location details if available
  useEffect(() => {
    if (locationDetails && !manualLocation && hasPermission) {
      const display = formatLocationDisplay(locationDetails);
      setInputValue(display);
      onLocationSelect?.({
        display,
        neighborhood: locationDetails.neighborhood,
        region: locationDetails.region,
        city: locationDetails.city,
        state: locationDetails.state
      });
    }
  }, [locationDetails, hasPermission]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    // Parse input to extract parts
    const parts = inputValue.split(/[-,]/).map(p => p.trim()).filter(Boolean);
    
    if (parts.length === 0) {
      setSuggestions([]);
      return;
    }

    // Create suggestions with proper hierarchy hints
    const newSuggestions: LocationSuggestion[] = [];
    
    // If only one part, suggest completing with more context
    if (parts.length === 1) {
      // Show hints to add more context
      newSuggestions.push({
        display: `${parts[0]} - [Bairro/Região]`,
        neighborhood: parts[0],
        region: "",
        city: "",
        state: ""
      });
    } else if (parts.length >= 2) {
      // Valid format with at least bairro - cidade
      newSuggestions.push({
        display: parts.join(" - "),
        neighborhood: parts[0] || "",
        region: parts.length > 2 ? parts[1] : "",
        city: parts.length > 2 ? parts[2] : parts[1] || "",
        state: parts.length > 3 ? parts[3] : ""
      });
    }

    setSuggestions(newSuggestions);
  }, [inputValue]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setManualLocation(value);
    setShowSuggestions(true);
    
    // Parse and notify parent
    const parts = value.split(/[-,]/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      onLocationSelect?.({
        display: value,
        neighborhood: parts[0] || "",
        region: parts.length > 2 ? parts[1] : "",
        city: parts.length > 2 ? parts[2] : parts[1] || "",
        state: parts.length > 3 ? parts[3] : ""
      });
    } else if (value === "") {
      onLocationSelect?.(null);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setInputValue(suggestion.display);
    setManualLocation(suggestion.display);
    setShowSuggestions(false);
    onLocationSelect?.(suggestion);
  };

  const handleClear = () => {
    setInputValue("");
    setManualLocation("");
    setSuggestions([]);
    onLocationSelect?.(null);
    inputRef.current?.focus();
  };

  const handleUseCurrentLocation = () => {
    if (locationDetails) {
      const display = formatLocationDisplay(locationDetails);
      setInputValue(display);
      setManualLocation(display);
      setShowSuggestions(false);
      onLocationSelect?.({
        display,
        neighborhood: locationDetails.neighborhood,
        region: locationDetails.region,
        city: locationDetails.city,
        state: locationDetails.state
      });
    } else {
      requestLocation();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Bairro - Cidade ou Cidade - Estado"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="pl-12 pr-20 h-14 text-base rounded-2xl border-2 border-transparent bg-secondary/50 focus:border-primary focus:bg-background transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleUseCurrentLocation}
            title={hasPermission ? "Usar localização atual" : "Solicitar localização"}
          >
            <Navigation className={cn("h-4 w-4", hasPermission && locationDetails && "text-primary")} />
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-xl shadow-lg overflow-hidden">
          {/* Current location option */}
          {!locationLoading && (
            <button
              type="button"
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left border-b"
              onClick={handleUseCurrentLocation}
            >
              <Navigation className={cn("h-5 w-5", hasPermission && locationDetails ? "text-primary" : "text-muted-foreground")} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {hasPermission && locationDetails 
                    ? "Usar minha localização atual" 
                    : "Solicitar localização"
                  }
                </p>
                {hasPermission && locationDetails && (
                  <p className="text-xs text-muted-foreground">
                    {formatLocationDisplay(locationDetails)}
                  </p>
                )}
              </div>
            </button>
          )}

          {/* Input validation hint */}
          {inputValue && inputValue.split(/[-,]/).filter(p => p.trim()).length < 2 && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
              <div className="flex items-start gap-2">
                <Search className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Complete a localização</p>
                  <p className="text-xs mt-1">
                    Use o formato: <strong>Bairro - Cidade</strong> ou <strong>Cidade - Estado</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions list */}
          {suggestions.length > 0 && inputValue.split(/[-,]/).filter(p => p.trim()).length >= 2 && (
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm">{suggestion.display}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
