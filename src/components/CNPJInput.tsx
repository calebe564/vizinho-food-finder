import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateCNPJ, formatCNPJ } from "@/lib/validationUtils";
import { Check, X, Search, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCNPJLookup } from "@/hooks/useCNPJLookup";
import { toast } from "sonner";

interface CNPJInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  onLookupSuccess?: (data: {
    razaoSocial: string;
    nomeFantasia: string;
    municipio: string;
    uf: string;
    bairro: string;
    logradouro: string;
    numero: string;
    cep: string;
    telefone: string;
  }) => void;
  showLookupButton?: boolean;
  autoLookup?: boolean;
}

export function CNPJInput({ 
  value, 
  onChange, 
  required = false, 
  label = "CNPJ", 
  disabled = false,
  onLookupSuccess,
  showLookupButton = false,
  autoLookup = true
}: CNPJInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { lookup, isLoading, result, error, apiUnavailable } = useCNPJLookup();
  const lastLookedUpCnpj = useRef<string>("");
  
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

  // Auto-lookup when CNPJ is complete and valid
  useEffect(() => {
    const cleanValue = value.replace(/\D/g, '');
    if (
      autoLookup &&
      cleanValue.length === 14 && 
      validateCNPJ(cleanValue) && 
      cleanValue !== lastLookedUpCnpj.current &&
      onLookupSuccess &&
      !isLoading
    ) {
      lastLookedUpCnpj.current = cleanValue;
      lookup(cleanValue);
    }
  }, [value, autoLookup, onLookupSuccess, lookup, isLoading]);

  // Notify parent when lookup succeeds
  useEffect(() => {
    if (result && onLookupSuccess) {
      onLookupSuccess(result);
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    }
  }, [result, onLookupSuccess]);

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

  const handleLookup = async () => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 14 && isValid) {
      lastLookedUpCnpj.current = cleanValue;
      await lookup(cleanValue);
    } else {
      toast.error("Digite um CNPJ válido para consultar");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cnpj" className="text-base font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
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
            disabled={disabled || isLoading}
          />
          {isValid !== null && !isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
            </div>
          )}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        {showLookupButton && onLookupSuccess && (
          <Button
            type="button"
            variant="outline"
            className="h-12 px-4"
            onClick={handleLookup}
            disabled={!isValid || isLoading || disabled}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {isValid === false && value.length > 0 && (
        <p className="text-sm text-destructive">CNPJ inválido</p>
      )}
      {error && !apiUnavailable && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {apiUnavailable && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Consulta automática indisponível
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                Preencha os dados da empresa manualmente. O CNPJ será marcado como "não verificado".
              </p>
            </div>
          </div>
        </div>
      )}
      {result && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm">
          <p className="font-medium text-green-800 dark:text-green-200">
            {result.nomeFantasia || result.razaoSocial}
          </p>
          <p className="text-green-700 dark:text-green-300 text-xs">
            {result.municipio} - {result.uf}
          </p>
          {!result.isValid && (
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
              ⚠️ Situação: {result.situacao}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
