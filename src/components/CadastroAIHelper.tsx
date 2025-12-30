import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Clock, FileText, Package, Loader2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface CadastroAIHelperProps {
  companyName?: string;
  category?: string;
  onApplySchedule?: (schedule: string) => void;
  onApplyDescription?: (description: string) => void;
  onApplyProducts?: (products: Array<{ name: string; price: string }>) => void;
}

export function CadastroAIHelper({
  companyName,
  category,
  onApplySchedule,
  onApplyDescription,
  onApplyProducts,
}: CadastroAIHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("horario");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Input states
  const [scheduleInput, setScheduleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [productsInput, setProductsInput] = useState("");

  // Result states
  const [scheduleResult, setScheduleResult] = useState("");
  const [descriptionResult, setDescriptionResult] = useState("");
  const [productsResult, setProductsResult] = useState<Array<{ nome: string; preco: string | null }>>([]);

  const callAI = async (type: string, input: string) => {
    if (!input.trim()) {
      toast.error("Digite algo para a IA processar");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-cadastro-helper", {
        body: {
          type,
          input,
          context: {
            name: companyName,
            category,
          },
        },
      });

      if (error) throw error;

      if (type === "horario") {
        setScheduleResult(data.result);
      } else if (type === "descricao") {
        setDescriptionResult(data.result);
      } else if (type === "produtos") {
        try {
          // Try to extract JSON from the response
          const jsonMatch = data.result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setProductsResult(parsed.produtos || []);
          }
        } catch {
          toast.error("Não foi possível processar a lista de produtos");
        }
      }
    } catch (error) {
      console.error("AI Helper error:", error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const applySchedule = () => {
    if (scheduleResult && onApplySchedule) {
      onApplySchedule(scheduleResult);
      toast.success("Horário aplicado ao formulário!");
    }
  };

  const applyDescription = () => {
    if (descriptionResult && onApplyDescription) {
      onApplyDescription(descriptionResult);
      toast.success("Descrição aplicada ao formulário!");
    }
  };

  const applyProducts = () => {
    if (productsResult.length > 0 && onApplyProducts) {
      const formattedProducts = productsResult.map(p => ({
        name: p.nome,
        price: p.preco || "",
      }));
      onApplyProducts(formattedProducts);
      toast.success("Produtos aplicados ao formulário!");
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader 
        className="cursor-pointer py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium">
              Assistente IA de Cadastro
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!isExpanded && (
          <p className="text-sm text-muted-foreground mt-1">
            Clique para usar a IA e facilitar o preenchimento
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="horario" className="text-xs sm:text-sm">
                <Clock className="h-4 w-4 mr-1" />
                Horário
              </TabsTrigger>
              <TabsTrigger value="descricao" className="text-xs sm:text-sm">
                <FileText className="h-4 w-4 mr-1" />
                Descrição
              </TabsTrigger>
              <TabsTrigger value="produtos" className="text-xs sm:text-sm">
                <Package className="h-4 w-4 mr-1" />
                Produtos
              </TabsTrigger>
            </TabsList>

            {/* Horário Tab */}
            <TabsContent value="horario" className="space-y-3 mt-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Descreva seu horário de funcionamento em texto livre:
                </p>
                <Textarea
                  placeholder="Ex: Funciona de segunda a sexta das 8 às 18 e sábado das 8 às 12"
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                onClick={() => callAI("horario", scheduleInput)}
                disabled={isLoading}
                size="sm"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Formatando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Formatar Horário
                  </>
                )}
              </Button>

              {scheduleResult && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium">Resultado:</p>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                    {scheduleResult}
                  </pre>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(scheduleResult)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {onApplySchedule && (
                      <Button size="sm" onClick={applySchedule} className="flex-1">
                        Usar este horário
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Descrição Tab */}
            <TabsContent value="descricao" className="space-y-3 mt-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Conte um pouco sobre sua empresa (o que vende, diferenciais, público):
                </p>
                <Textarea
                  placeholder="Ex: Lanchonete familiar, servimos hambúrgueres artesanais e porções, atendemos no local e por delivery"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => callAI("descricao", descriptionInput)}
                disabled={isLoading}
                size="sm"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Descrição
                  </>
                )}
              </Button>

              {descriptionResult && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium">Resultado:</p>
                  <p className="text-sm bg-muted p-2 rounded">
                    {descriptionResult}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(descriptionResult)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {onApplyDescription && (
                      <Button size="sm" onClick={applyDescription} className="flex-1">
                        Usar esta descrição
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Produtos Tab */}
            <TabsContent value="produtos" className="space-y-3 mt-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Liste seus produtos (pode incluir preços):
                </p>
                <Textarea
                  placeholder="Ex: Hambúrguer simples 15 reais, hambúrguer duplo 22, batata frita 12, refrigerante lata 6"
                  value={productsInput}
                  onChange={(e) => setProductsInput(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => callAI("produtos", productsInput)}
                disabled={isLoading}
                size="sm"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Organizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Organizar Produtos
                  </>
                )}
              </Button>

              {productsResult.length > 0 && (
                <div className="p-3 bg-background rounded-lg border space-y-2">
                  <p className="text-sm font-medium">Produtos encontrados:</p>
                  <ul className="text-sm space-y-1">
                    {productsResult.map((p, i) => (
                      <li key={i} className="flex justify-between bg-muted p-2 rounded">
                        <span>{p.nome}</span>
                        <span className="text-muted-foreground">
                          {p.preco ? `R$ ${p.preco}` : "Sem preço"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {onApplyProducts && (
                    <Button size="sm" onClick={applyProducts} className="w-full">
                      Adicionar estes produtos
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
