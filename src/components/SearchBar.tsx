import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const handleChange = (newValue: string) => {
    if (onChange) onChange(newValue);
    if (onSearch) onSearch(newValue);
  };
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar por nome, categoria ou produto..."
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 h-12 text-base"
      />
    </div>
  );
}
