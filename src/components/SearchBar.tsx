import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  isSearching?: boolean;
}

export function SearchBar({ 
  value, 
  onChange, 
  onSearch,
  isSearching = false
}: SearchBarProps) {
  const handleChange = (newValue: string) => {
    if (onChange) onChange(newValue);
    if (onSearch) onSearch(newValue);
  };
  
  return (
    <div className="relative w-full">
      {isSearching ? (
        <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        type="text"
        placeholder="Buscar produto, empresa ou categoria..."
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 pr-9 h-10 md:h-11 text-sm rounded-full border border-border bg-secondary/50 focus:bg-card focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
