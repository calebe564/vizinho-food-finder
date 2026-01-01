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
        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      )}
      <Input
        type="text"
        placeholder="Buscar por produto, empresa ou categoria..."
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-12 pr-10 h-14 text-base rounded-full border border-border bg-card shadow-card focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
