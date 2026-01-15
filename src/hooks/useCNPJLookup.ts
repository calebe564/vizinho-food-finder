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

    try {
      // Use ReceitaWS API
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        // Handle rate limiting or other errors
        if (response.status === 429) {
          throw new Error("Muitas requisições. Aguarde um momento e tente novamente.");
        }
        throw new Error("Erro ao consultar CNPJ. Tente novamente.");
      }

      const data: CNPJData = await response.json();

      // Check if CNPJ was found
      if (data.status === "ERROR") {
        setError(data.message || "CNPJ não encontrado na Receita Federal");
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
      const message = err instanceof Error ? err.message : "Erro ao consultar CNPJ";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    lookup,
    clear,
    isLoading,
    result,
    error,
  };
}
