import { useState, useCallback } from "react";
import { toast } from "sonner";

interface CNPJData {
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
  abertura: string;
  atividade_principal: { code: string; text: string }[];
  status: string;
  message?: string;
}

interface CNPJResult {
  razaoSocial: string;
  nomeFantasia: string;
  municipio: string;
  uf: string;
  bairro: string;
  logradouro: string;
  numero: string;
  cep: string;
  telefone: string;
  situacao: string;
  atividadePrincipal: string;
  isValid: boolean;
}

export function useCNPJLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CNPJResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const lookup = useCallback(async (cnpj: string): Promise<CNPJResult | null> => {
    // Clean CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, "");
    
    if (cleanCnpj.length !== 14) {
      setError("CNPJ deve ter 14 dígitos");
      return null;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setApiUnavailable(false);

    try {
      // Try ReceitaWS API first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle rate limiting or other errors - allow manual input
        if (response.status === 429) {
          setApiUnavailable(true);
          setError("API temporariamente indisponível. Preencha manualmente.");
          toast.warning("API de CNPJ indisponível. Preencha os dados manualmente.");
          return null;
        }
        throw new Error("Erro ao consultar CNPJ");
      }

      const data: CNPJData = await response.json();

      // Check if CNPJ was found
      if (data.status === "ERROR") {
        setError(data.message || "CNPJ não encontrado na Receita Federal");
        setApiUnavailable(true);
        toast.warning("CNPJ não encontrado. Preencha os dados manualmente.");
        return null;
      }

      const resultData: CNPJResult = {
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
      
      if (!resultData.isValid) {
        toast.warning(`CNPJ com situação: ${data.situacao}`);
      }

      return resultData;
    } catch (err) {
      // Handle timeout or network errors - allow manual input
      if (err instanceof Error && err.name === "AbortError") {
        setApiUnavailable(true);
        setError("Consulta demorou muito. Preencha manualmente.");
        toast.warning("Consulta de CNPJ expirou. Preencha os dados manualmente.");
        return null;
      }
      
      const message = err instanceof Error ? err.message : "Erro ao consultar CNPJ";
      setError(message);
      setApiUnavailable(true);
      toast.warning("Não foi possível consultar o CNPJ. Preencha manualmente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setApiUnavailable(false);
  }, []);

  return {
    lookup,
    clear,
    isLoading,
    result,
    error,
    apiUnavailable,
  };
}
