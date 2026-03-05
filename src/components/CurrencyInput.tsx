import * as React from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencyInput({ value, onChange, placeholder = "0,00", className, disabled }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => {
    if (value > 0) {
      return formatForDisplay(value);
    }
    return '';
  });

  // Sync when value changes externally (e.g. form reset)
  React.useEffect(() => {
    if (value > 0) {
      setDisplayValue(formatForDisplay(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  function formatForDisplay(num: number): string {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseInput(raw: string): number {
    // Remove R$ and spaces
    let cleaned = raw.replace(/R\$\s?/g, '').trim();
    // Replace comma with dot for parsing
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing freely - only numbers, comma, dot
    const raw = e.target.value.replace(/[^0-9.,]/g, '');
    setDisplayValue(raw);
  };

  const handleBlur = () => {
    const parsed = parseInput(displayValue);
    onChange(parsed);
    if (parsed > 0) {
      setDisplayValue(formatForDisplay(parsed));
    } else {
      setDisplayValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
        R$
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`pl-10 ${className || ''}`}
        disabled={disabled}
      />
    </div>
  );
}
