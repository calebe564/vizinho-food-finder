import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, Crown, Rocket, Sparkles, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserEstablishments } from "@/hooks/useUserEstablishments";
import { usePlanConfigs, type PlanConfig } from "@/hooks/usePlanConfig";
import { useLaunchCampaign } from "@/hooks/useLaunchCampaign";
import { useEstablishmentSubscriptions, useRequestPlan, useWithdrawRequest } from "@/hooks/useSubscriptions";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, productLimitLabel, sellablePlans } from "@/config/plans";
import { ratingOf } from "@/lib/dbFields";

const PLAN_ICONS: Record<string, typeof Star> = { start: Zap, pro: Crown, max: Rocket };
const FEATURED_PLAN = "pro";

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { establishments, isLoading: loadingEstablishments } = useUserEstablishments();
  const { data: planConfigs = [] } = usePlanConfigs();
  const { data: campaign } = useLaunchCampaign();

  const [selectedId, setSelectedId] = useState<string>("");
  const [confirmPlan, setConfirmPlan] = useState<PlanConfig | null>(null);
  const [wantsOffer, setWantsOffer] = useState(false);

  const activeEstablishments = establishments.filter((e) => e.establishment.active);
  const plans = useMemo(() => sellablePlans(planConfigs) as PlanConfig[], [planConfigs]);

  const { data: subscriptions = [] } = useEstablishmentSubscriptions(selectedId || undefined);
  const requestPlan = useRequestPlan(selectedId || undefined);
  const withdraw = useWithdrawRequest(selectedId || undefined);

  const { data: establishmentInfo } = useQuery({
    queryKey: ["plan-establishment-info", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase.from("establishments").select("plan").eq("id", selectedId).maybeSingle(),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("establishment_id", selectedId),
      ]);
      return { plan: data?.plan ?? "gratuito", productsUsed: count ?? 0 };
    },
  });

  const currentPlanName = establishmentInfo?.plan ?? "gratuito";
  const currentConfig = planConfigs.find((p) => p.plan_name === currentPlanName);
  const activeSub = subscriptions.find((s) => s.status === "active");
  const pendingSub = subscriptions.find((s) => s.status === "pending");
  const launchOffer = campaign?.is_open ? campaign : null;

  const goToLogin = () => navigate("/auth", { state: { from: "/planos" } });

  const openConfirm = (plan: PlanConfig) => {
    if (!user) return goToLogin();
    if (!selectedId) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }
    setWantsOffer(!!launchOffer && launchOffer.plan_name === plan.plan_name);
    setConfirmPlan(plan);
  };

  const submitRequest = async () => {
    if (!confirmPlan) return;
    try {
      await requestPlan.mutateAsync({
        planName: confirmPlan.plan_name,
        wantsLaunchOffer: wantsOffer && launchOffer?.plan_name === confirmPlan.plan_name,
      });
      toast.success("Solicitação enviada! A equipe vai analisar e entrar em contato.");
      setConfirmPlan(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a solicitação.");
    }
  };

  const offerAppliesTo = (plan: PlanConfig) => !!launchOffer && launchOffer.plan_name === plan.plan_name;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Planos | Comércio Vizinho</title>
        <meta name="description" content="Conheça os planos Start, Pro e Max do Comércio Vizinho para divulgar o seu comércio ou serviço." />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Planos</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Escolha o plano que cabe no seu negócio. Todos permitem cadastrar produtos com fotos e preços.
          </p>
        </div>

        {/* Campanha de lançamento: só aparece com números reais vindos do banco */}
        {campaign && (
          <section
            aria-labelledby="campanha-titulo"
            className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="campanha-titulo" className="font-semibold text-foreground">
                {campaign.name}
              </h2>
              {campaign.is_open ? <Badge>Vagas abertas</Badge> : <Badge variant="secondary">Encerrada</Badge>}
            </div>

            {campaign.is_open ? (
              <>
                <p className="text-sm text-foreground">
                  Para os <strong>{campaign.spots_total} primeiros estabelecimentos aprovados</strong>:{" "}
                  <strong>{formatBRL(campaign.promo_price_cents)} por mês durante os primeiros {campaign.promo_months} meses</strong>
                  , com os recursos do plano {plans.find((p) => p.plan_name === campaign.plan_name)?.display_label ?? campaign.plan_name}.
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                  <li className="rounded-lg bg-card border border-border p-3">
                    <span className="block text-xs text-muted-foreground">Vagas restantes</span>
                    <span className="text-lg font-bold">
                      {campaign.spots_remaining} de {campaign.spots_total}
                    </span>
                  </li>
                  <li className="rounded-lg bg-card border border-border p-3">
                    <span className="block text-xs text-muted-foreground">Valor promocional</span>
                    <span className="text-lg font-bold">{formatBRL(campaign.promo_price_cents)}/mês</span>
                  </li>
                  <li className="rounded-lg bg-card border border-border p-3">
                    <span className="block text-xs text-muted-foreground">Depois de {campaign.promo_months} meses</span>
                    <span className="text-lg font-bold">a partir de {formatBRL(campaign.regular_price_cents)}/mês</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  As vagas contam as adesões reais. Terminado o período promocional, é preciso escolher um dos planos regulares.
                  A cobrança não é automática.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                As {campaign.spots_total} vagas da campanha de lançamento já foram preenchidas. Os planos regulares continuam disponíveis.
              </p>
            )}
          </section>
        )}

        {/* Escolha da empresa */}
        {user && activeEstablishments.length > 0 && (
          <div className="mb-8 max-w-sm mx-auto">
            <Label className="text-sm font-medium text-foreground mb-2 block text-center">Para qual empresa?</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full" aria-label="Selecione a empresa">
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

            {selectedId && (
              <div className="mt-3 rounded-xl border border-border bg-card p-3 text-sm space-y-1.5" aria-live="polite">
                <p>
                  Plano atual: <Badge variant="secondary">{currentConfig?.display_label ?? currentPlanName}</Badge>
                </p>
                {establishmentInfo && currentConfig && (
                  <p className="text-muted-foreground">
                    Produtos: <strong className="text-foreground">{establishmentInfo.productsUsed}</strong> de{" "}
                    {productLimitLabel(currentConfig.max_products)}
                  </p>
                )}
                {activeSub?.promo_ends_at && (
                  <p className="text-muted-foreground flex items-start gap-1.5">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      Condição de lançamento até <strong className="text-foreground">{formatDate(activeSub.promo_ends_at)}</strong>.
                      Depois, escolha um plano regular.
                    </span>
                  </p>
                )}
                {pendingSub && (
                  <div className="rounded-lg bg-muted p-2.5">
                    <p>
                      Solicitação em análise:{" "}
                      <strong>{planConfigs.find((p) => p.plan_name === pendingSub.plan_name)?.display_label ?? pendingSub.plan_name}</strong>
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      disabled={withdraw.isPending}
                      onClick={() =>
                        withdraw.mutate(pendingSub.id, {
                          onSuccess: () => toast.success("Solicitação cancelada."),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                    >
                      Cancelar solicitação
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {user && activeEstablishments.length === 0 && !loadingEstablishments && (
          <div className="text-center mb-8 p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground">
              Você ainda não tem uma empresa aprovada.{" "}
              <Link to="/cadastrar" className="text-primary hover:underline font-medium">
                Cadastre sua empresa
              </Link>
            </p>
          </div>
        )}

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.plan_name] ?? Star;
            const featured = plan.plan_name === FEATURED_PLAN;
            const isCurrent = !!selectedId && currentPlanName === plan.plan_name;
            const isPending = pendingSub?.plan_name === plan.plan_name;

            return (
              <Card
                key={plan.plan_name}
                className={`relative overflow-hidden ${featured ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
              >
                <CardHeader className="text-center pb-2 pt-6">
                  <div
                    className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      featured ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{plan.display_label}</h2>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl font-extrabold text-foreground">{formatBRL(plan.price_cents)}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  {offerAppliesTo(plan) && launchOffer && (
                    <p className="text-xs font-medium text-primary mt-1">
                      Lançamento: {formatBRL(launchOffer.promo_price_cents)}/mês nos primeiros {launchOffer.promo_months} meses
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-2 pb-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${featured ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button disabled className="w-full" variant="outline">
                      Plano atual
                    </Button>
                  ) : isPending ? (
                    <Button disabled className="w-full" variant="outline">
                      Solicitação em análise
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={featured ? "default" : "outline"}
                      disabled={!!pendingSub || (!!user && activeEstablishments.length === 0)}
                      onClick={() => openConfirm(plan)}
                    >
                      {!user ? "Entrar para solicitar" : "Solicitar este plano"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparação */}
        {plans.length > 0 && (
          <section className="mt-10" aria-labelledby="comparar-titulo">
            <h2 id="comparar-titulo" className="text-lg font-semibold mb-3">
              Comparar planos
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="text-left p-3 font-medium">Recurso</th>
                    {plans.map((p) => (
                      <th key={p.plan_name} scope="col" className="text-center p-3 font-semibold">{p.display_label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <th scope="row" className="text-left p-3 font-normal">Preço por mês</th>
                    {plans.map((p) => (
                      <td key={p.plan_name} className="text-center p-3">{formatBRL(p.price_cents)}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-border">
                    <th scope="row" className="text-left p-3 font-normal">Produtos cadastrados</th>
                    {plans.map((p) => (
                      <td key={p.plan_name} className="text-center p-3">até {productLimitLabel(p.max_products)}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-border">
                    <th scope="row" className="text-left p-3 font-normal">Fotos e preços nos produtos</th>
                    {plans.map((p) => (
                      <td key={p.plan_name} className="text-center p-3">
                        <Check className="h-4 w-4 mx-auto text-primary" aria-label="Incluído" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="text-center mt-8 mb-4 space-y-1">
          <p className="text-xs text-muted-foreground">
            A cobrança online ainda não está ativa: ao solicitar um plano, a equipe analisa e entra em contato para combinar o pagamento.
          </p>
          <p className="text-xs text-muted-foreground">
            Os planos não garantem vendas, visitas ou qualquer resultado.
          </p>
        </div>
      </main>

      {/* Confirmação */}
      <Dialog open={!!confirmPlan} onOpenChange={(open) => !open && setConfirmPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar plano {confirmPlan?.display_label}</DialogTitle>
            <DialogDescription>
              Valor regular: {confirmPlan ? formatBRL(confirmPlan.price_cents) : ""} por mês. Nada será cobrado agora: a equipe vai analisar o pedido e
              entrar em contato.
            </DialogDescription>
          </DialogHeader>

          {confirmPlan && offerAppliesTo(confirmPlan) && launchOffer && (
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Checkbox id="oferta" checked={wantsOffer} onCheckedChange={(v) => setWantsOffer(v === true)} className="mt-0.5" />
              <Label htmlFor="oferta" className="text-sm leading-snug cursor-pointer">
                Quero a condição de lançamento: {formatBRL(launchOffer.promo_price_cents)} por mês nos primeiros {launchOffer.promo_months} meses.
                Depois disso, {formatBRL(confirmPlan.price_cents)} por mês ou outro plano à sua escolha. Sujeito à aprovação e às vagas disponíveis.
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPlan(null)}>
              Voltar
            </Button>
            <Button onClick={submitRequest} disabled={requestPlan.isPending}>
              {requestPlan.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
