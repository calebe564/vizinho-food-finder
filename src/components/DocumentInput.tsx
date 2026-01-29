import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateDocument, formatDocument, detectDocumentType, validateAge, type DocumentType } from "@/lib/validationUtils";
import { Check, X, Search, Loader2, AlertTriangle, User, Building2, Calendar } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface CNPJAPIData {
  cnpj: string;
  nome: string;
  fantasia: string;
  situacao: string;
  municipio: string;
  uf: string;
  bairro: string;
  logradouro: string;
  numero: string;
  cep: string;
  telefone: string;
  atividade_principal: { code: string; text: string }[];
  status: string;
  message?: string;
}

export interface DocumentLookupResult {
  documentType: DocumentType;
  // For CNPJ
  razaoSocial?: string;
  nomeFantasia?: string;
  municipio?: string;
  uf?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  cep?: string;
  telefone?: string;
  situacao?: string;
  atividadePrincipal?: string;
  isValid?: boolean;
  // For CPF (manual entry required)
  cpfValidated?: boolean;
}

export interface CPFFormData {
  nomeCompleto: string;
  dataNascimento: string;
  endereco: string;
  telefone: string;
  categoria: string;
}

interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  onLookupSuccess?: (data: DocumentLookupResult) => void;
  onDocumentTypeChange?: (type: DocumentType) => void;
  showLookupButton?: boolean;
  autoLookup?: boolean;
  // CPF additional data
  cpfData?: CPFFormData;
  onCPFDataChange?: (data: CPFFormData) => void;
  showCPFFields?: boolean;
}

export function DocumentInput({ 
  value, 
  onChange, 
  required = false, 
  label = "Documento (CNPJ ou CPF)", 
  disabled = false,
  onLookupSuccess,
  onDocumentTypeChange,
  showLookupButton = false,
  autoLookup = true,
  cpfData,
  onCPFDataChange,
  showCPFFields = false,
}: DocumentInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [result, setResult] = useState<DocumentLookupResult | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const lastLookedUpDoc = useRef<string>("");

  // Detect document type and validate
  useEffect(() => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length === 0) {
      setIsValid(null);
      setDocumentType('unknown');
      setError(null);
      setResult(null);
      return;
    }

    const detected = detectDocumentType(cleanValue);
    setDocumentType(detected);
    onDocumentTypeChange?.(detected);

    if (detected === 'unknown') {
      // Still typing
      if (cleanValue.length < 11) {
        setIsValid(null);
      } else {
        setIsValid(false);
      }
    } else {
      const { isValid: valid } = validateDocument(cleanValue);
      setIsValid(valid);
    }
  }, [value, onDocumentTypeChange]);

  // Auto-lookup for CNPJ when complete and valid
  useEffect(() => {
    const cleanValue = value.replace(/\D/g, '');
    if (
      autoLookup &&
      cleanValue.length === 14 && 
      documentType === 'cnpj' &&
      isValid === true &&
      cleanValue !== lastLookedUpDoc.current &&
      onLookupSuccess &&
      !isLoading
    ) {
      lastLookedUpDoc.current = cleanValue;
      lookupCNPJ(cleanValue);
    }
  }, [value, documentType, isValid, autoLookup, onLookupSuccess, isLoading]);

  // For CPF, validate age when birth date changes
  useEffect(() => {
    if (documentType === 'cpf' && cpfData?.dataNascimento) {
      if (!validateAge(cpfData.dataNascimento)) {
        setAgeError('Você deve ter pelo menos 18 anos para cadastrar uma empresa.');
      } else {
        setAgeError(null);
      }
    } else {
      setAgeError(null);
    }
  }, [documentType, cpfData?.dataNascimento]);

  const lookupCNPJ = useCallback(async (cleanCnpj: string, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 2000;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setApiUnavailable(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Rate limited, retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return lookupCNPJ(cleanCnpj, retryCount + 1);
          }
          setApiUnavailable(true);
          setError("API temporariamente indisponível. Você pode preencher manualmente.");
          return;
        }
        throw new Error("Erro ao consultar CNPJ");
      }

      const data: CNPJAPIData = await response.json();

      if (data.status === "ERROR") {
        setError(data.message || "CNPJ não encontrado na Receita Federal");
        return;
      }

      const resultData: DocumentLookupResult = {
        documentType: 'cnpj',
        razaoSocial: data.nome || "",
        nomeFantasia: data.fantasia || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
        bairro: data.bairro || "",
        logradouro: data.logradouro || "",
        numero: data.numero || "",
        cep: data.cep?.replace(/\D/g, "") || "",
        telefone: data.telefone?.replace(/\D/g, "") || "",
        situacao: data.situacao || "",
        atividadePrincipal: data.atividade_principal?.[0]?.text || "",
        isValid: data.situacao === "ATIVA",
      };

      setResult(resultData);
      onLookupSuccess?.(resultData);
      toast.success("Dados do CNPJ preenchidos automaticamente!");
      
      if (!resultData.isValid) {
        toast.warning(`CNPJ com situação: ${data.situacao}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (retryCount < MAX_RETRIES) {
          console.log(`Request timeout, retrying... (attempt ${retryCount + 1})`);
          return lookupCNPJ(cleanCnpj, retryCount + 1);
        }
        setApiUnavailable(true);
        setError("Consulta demorou muito. Você pode preencher manualmente.");
        return;
      }
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Network error, retrying... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return lookupCNPJ(cleanCnpj, retryCount + 1);
      }
      
      setError("Erro ao consultar CNPJ. Você pode preencher manualmente.");
      setApiUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  }, [onLookupSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '');
    
    // Limit to 14 digits (CNPJ is longer than CPF)
    if (inputValue.length > 14) {
      inputValue = inputValue.slice(0, 14);
    }
    
    // Format based on length
    if (inputValue.length <= 11) {
      // Format as CPF: XXX.XXX.XXX-XX
      if (inputValue.length > 9) {
        inputValue = inputValue.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
      } else if (inputValue.length > 6) {
        inputValue = inputValue.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
      } else if (inputValue.length > 3) {
        inputValue = inputValue.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
      }
    } else {
      // Format as CNPJ: XX.XXX.XXX/XXXX-XX
      if (inputValue.length > 12) {
        inputValue = inputValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
      } else if (inputValue.length > 8) {
        inputValue = inputValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
      } else if (inputValue.length > 5) {
        inputValue = inputValue.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
      } else if (inputValue.length > 2) {
        inputValue = inputValue.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
      }
    }
    
    onChange(inputValue);
  };

  const handleManualLookup = async () => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 14 && isValid && documentType === 'cnpj') {
      lastLookedUpDoc.current = cleanValue;
      await lookupCNPJ(cleanValue);
    } else {
      toast.error("Digite um CNPJ válido para consultar");
    }
  };

  // CPF validation success - just mark as validated
  const handleCPFValidated = () => {
    if (documentType === 'cpf' && isValid && cpfData) {
      // Validate all CPF fields
      if (!cpfData.nomeCompleto.trim()) {
        toast.error("Nome completo é obrigatório");
        return;
      }
      if (!cpfData.dataNascimento) {
        toast.error("Data de nascimento é obrigatória");
        return;
      }
      if (!validateAge(cpfData.dataNascimento)) {
        toast.error("Você deve ter pelo menos 18 anos");
        return;
      }
      if (!cpfData.endereco.trim()) {
        toast.error("Endereço do negócio é obrigatório");
        return;
      }
      if (!cpfData.telefone.trim()) {
        toast.error("Telefone/WhatsApp é obrigatório");
        return;
      }

      const resultData: DocumentLookupResult = {
        documentType: 'cpf',
        cpfValidated: true,
      };
      setResult(resultData);
      onLookupSuccess?.(resultData);
      toast.success("Dados validados com sucesso!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document" className="text-base font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <p className="text-xs text-muted-foreground">
          Você pode cadastrar empresa por CNPJ ou negócio em nome de pessoa física (CPF)
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="document"
              type="text"
              value={value}
              onChange={handleChange}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
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
          {showLookupButton && documentType === 'cnpj' && onLookupSuccess && (
            <Button
              type="button"
              variant="outline"
              className="h-12 px-4"
              onClick={handleManualLookup}
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
      </div>

      {/* Document type indicator */}
      {documentType !== 'unknown' && isValid && (
        <div className="flex items-center gap-2 text-sm">
          {documentType === 'cpf' ? (
            <>
              <User className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Pessoa Física (CPF)</span>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Pessoa Jurídica (CNPJ)</span>
            </>
          )}
        </div>
      )}

      {isValid === false && value.length > 0 && (
        <p className="text-sm text-destructive">
          {documentType === 'cpf' ? 'CPF inválido' : 
           documentType === 'cnpj' ? 'CNPJ inválido' : 
           'Documento inválido'}
        </p>
      )}

      {error && !apiUnavailable && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {apiUnavailable && documentType === 'cnpj' && (
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

      {/* CNPJ Result */}
      {result && documentType === 'cnpj' && result.razaoSocial && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm">
          <p className="font-medium text-green-800 dark:text-green-200">
            {result.nomeFantasia || result.razaoSocial}
          </p>
          <p className="text-green-700 dark:text-green-300 text-xs">
            {result.municipio} - {result.uf}
          </p>
          {result.situacao && result.situacao !== 'ATIVA' && (
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
              ⚠️ Situação: {result.situacao}
            </p>
          )}
        </div>
      )}

      {/* CPF Additional Fields */}
      {showCPFFields && documentType === 'cpf' && isValid && cpfData && onCPFDataChange && (
        <div className="space-y-4 p-4 rounded-xl bg-muted/50 border">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Dados do Responsável</h4>
          </div>
          <p className="text-xs text-muted-foreground -mt-2 mb-3">
            🔒 Esses dados são privados e visíveis apenas para você e administradores
          </p>

          <div className="space-y-2">
            <Label htmlFor="cpf-nome">Nome Completo *</Label>
            <Input
              id="cpf-nome"
              value={cpfData.nomeCompleto}
              onChange={(e) => onCPFDataChange({ ...cpfData, nomeCompleto: e.target.value })}
              placeholder="Seu nome completo"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf-nascimento">Data de Nascimento *</Label>
            <div className="relative">
              <Input
                id="cpf-nascimento"
                type="date"
                value={cpfData.dataNascimento}
                onChange={(e) => onCPFDataChange({ ...cpfData, dataNascimento: e.target.value })}
                className="h-11"
                max={new Date().toISOString().split('T')[0]}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {ageError && (
              <p className="text-sm text-destructive">{ageError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf-endereco">Endereço do Negócio *</Label>
            <Input
              id="cpf-endereco"
              value={cpfData.endereco}
              onChange={(e) => onCPFDataChange({ ...cpfData, endereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade - UF"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf-telefone">Telefone/WhatsApp *</Label>
            <Input
              id="cpf-telefone"
              value={cpfData.telefone}
              onChange={(e) => onCPFDataChange({ ...cpfData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="h-11"
            />
          </div>

          {!result?.cpfValidated && (
            <Button 
              type="button" 
              onClick={handleCPFValidated}
              className="w-full mt-2"
              disabled={!!ageError}
            >
              <Check className="h-4 w-4 mr-2" />
              Validar Dados
            </Button>
          )}

          {result?.cpfValidated && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-medium">Dados validados</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
