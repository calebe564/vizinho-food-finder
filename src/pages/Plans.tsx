import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Zap, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useUserEstablishments } from "@/hooks/useUserEstablishments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const plans = [
  {
    id: "gratuito",
    name: "FREE",
    price: "R$0",
    period: "/mês",
    description: "Para começar a divulgar seu negócio",
    icon: Star,
    featured: false,
    benefits: [
      "Até 5 produtos cadastrados",
      "Visibilidade básica nos resultados",
      "Perfil da empresa com informações",
      "Avaliações de clientes",
      "Compartilhamento via link",
    ],
  },
  {
    id: "basico",
    name: "BASIC",
    price: "R$49,90",
    period: "/mês",
    description: "Mais visibilidade para seu negócio",
    icon: Zap,
    featured: true,
    benefits: [
      "Até 20 produtos cadastrados",
      "Visibilidade média nos resultados",
      "Maior chance nos destaques",
      "Promoções aumentam visibilidade",
      "Todos os benefícios do FREE",
    ],
  },
  {
    id: "profissional",
    name: "PRO",
    price: "R$89,90",
    period: "/mês",
    description: "Máxima visibilidade e prioridade total",
    icon: Crown,
    featured: false,
    benefits: [
      "Produtos ilimitados",
      "Prioridade máxima nos resultados",
      "Maior chance nos destaques",
      "Promoções com maior impacto",
      "Todos os benefícios do BASIC",
    ],
  },
];

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { establishments, isLoading, refetch } = useUserEstablishments();
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("");
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const activeEstablishments = establishments.filter(e => e.establishment.active);
  const currentEstablishment = activeEstablishments.find(
    e => e.establishment_id === selectedEstablishment
  );

  // Get current plan for selected establishment
  const [currentPlan, setCurrentPlan] = useState<string>("gratuito");

  const fetchCurrentPlan = async (establishmentId: string) => {
    const { data } = await supabase
      .from("establishments")
      .select("plan")
      .eq("id", establishmentId)
      .maybeSingle();
    if (data) setCurrentPlan(data.plan);
  };

  const handleSelectEstablishment = (id: string) => {
    setSelectedEstablishment(id);
    fetchCurrentPlan(id);
  };

  const handleChangePlan = async (planId: string) => {
    if (!selectedEstablishment) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }
    if (!user) {
      navigate("/auth", { state: { from: "/planos" } });
      return;
    }

    setChangingPlan(planId);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ plan: planId })
        .eq("id", selectedEstablishment);

      if (error) throw error;

      setCurrentPlan(planId);
      toast.success(`Plano alterado para ${plans.find(p => p.id === planId)?.name || planId}!`);
      await refetch();
    } catch (err) {
      toast.error("Erro ao alterar plano: " + (err.message || "Tente novamente"));
    } finally {
      setChangingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back */}
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Escolha seu Plano</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Aumente a visibilidade do seu negócio e alcance mais clientes
          </p>
        </div>

        {/* Establishment Selector */}
        {user && activeEstablishments.length > 0 && (
          <div className="mb-8 max-w-sm mx-auto">
            <label className="text-sm font-medium text-foreground mb-2 block text-center">
              Selecione sua empresa
            </label>
            <Select value={selectedEstablishment} onValueChange={handleSelectEstablishment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha uma empresa..." />
              </SelectTrigger>
              <SelectContent>
                {activeEstablishments.map((est) => (
                  <SelectItem key={est.establishment_id} value={est.establishment_id}>
                    {est.establishment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEstablishment && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Plano atual: <Badge variant="secondary" className="ml-1">{plans.find(p => p.id === currentPlan)?.name || currentPlan}</Badge>
              </p>
            )}
          </div>
        )}

        {user && activeEstablishments.length === 0 && !isLoading && (
          <div className="text-center mb-8 p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground">
              Você ainda não tem uma empresa cadastrada.{" "}
              <Link to="/cadastrar" className="text-primary hover:underline font-medium">
                Cadastre agora
              </Link>
            </p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = selectedEstablishment && currentPlan === plan.id;
            const Icon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.featured
                    ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:shadow-md"
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs font-semibold py-1">
                    ⭐ Mais popular
                  </div>
                )}

                <CardHeader className={`text-center pb-2 ${plan.featured ? "pt-8" : "pt-6"}`}>
                  <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    plan.featured
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-2 pb-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          plan.featured ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      Plano atual
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${plan.featured ? "" : "variant-outline"}`}
                      variant={plan.featured ? "default" : "outline"}
                      disabled={!!changingPlan || (!user || activeEstablishments.length === 0)}
                      onClick={() => {
                        if (!user) {
                          navigate("/auth", { state: { from: "/planos" } });
                          return;
                        }
                        if (!selectedEstablishment) {
                          toast.error("Selecione uma empresa primeiro");
                          return;
                        }
                        handleChangePlan(plan.id);
                      }}
                    >
                      {changingPlan === plan.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : !user ? (
                        "Entrar para assinar"
                      ) : (
                        "Escolher plano"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-muted-foreground">
            💡 Os planos podem ser alterados a qualquer momento. Futuramente a cobrança será ativada via pagamento online.
          </p>
        </div>
      </main>
    </div>
  );
}