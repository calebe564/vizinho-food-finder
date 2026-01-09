import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCNPJ, formatCNPJ } from "@/lib/validationUtils";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";

interface CNPJInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  disabled?: boolean;
}

export function CNPJInput({ value, onChange, required = false, label = "CNPJ", disabled = false }: CNPJInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  useEffect(() => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 0) {
      setIsValid(null);
    } else if (cleanValue.length === 14) {
      setIsValid(validateCNPJ(cleanValue));
    } else {
      setIsValid(false);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '');
    
    // Limit to 14 digits
    if (inputValue.length > 14) {
      inputValue = inputValue.slice(0, 14);
    }
    
    // Format as XX.XXX.XXX/XXXX-XX
    if (inputValue.length > 12) {
      inputValue = inputValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    } else if (inputValue.length > 8) {
      inputValue = inputValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else if (inputValue.length > 5) {
      inputValue = inputValue.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (inputValue.length > 2) {
      inputValue = inputValue.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
    }
    
    onChange(inputValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cnpj" className="text-base font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="cnpj"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="00.000.000/0000-00"
          className={`h-12 rounded-xl pr-10 ${
            isValid === true ? 'border-green-500' : 
            isValid === false ? 'border-destructive' : ''
          }`}
          required={required}
          disabled={disabled}
        />
        {isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-destructive" />
            )}
          </div>
        )}
      </div>
      {isValid === false && value.length > 0 && (
        <p className="text-sm text-destructive">CNPJ inválido</p>
      )}
    </div>
  );
}
