import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Crown, Eye, ExternalLink, MessageCircle, MousePointerClick, Package, Pencil, Plus, Tag, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { EstablishmentSelector } from "@/components/EstablishmentSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useActiveEstablishment } from "@/contexts/ActiveEstablishmentContext";
import { supabase } from "@/integrations/supabase/client";
import { getPlanConfig, usePlanConfigs } from "@/hooks/usePlanConfig";
import { useEstablishmentSubscriptions } from "@/hooks/useSubscriptions";
import { useMerchantProducts } from "@/hooks/useMerchantProducts";
import { barHeights, otherClicks, totalOf, useMerchantMetrics, type MerchantMetrics, type PeriodDays } from "@/hooks/useMerchantMetrics";
import { formatBRL, isAtProductLimit, productLimitLabel, productsRemaining } from "@/config/plans";
import { MERCHANT_COMPANY } from "@/config/areas";
import { promoOf } from "@/lib/dbFields";

const PERIODS: { value: PeriodDays; label: string }[] = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");
const formatDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

interface MetricCardProps {
  title: string;
  value: number | null;
  caption?: string;
  icon: typeof Eye;
}

/** Cartão de número. `value === null` significa "indisponível" (nunca mostramos zero no lugar). */
function MetricCard({ title, value, caption, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {title}
        </div>
        <p className="mt-1 text-3xl font-bold" aria-label={value === null ? `${title}: indisponível` : `${title}: ${value}`}>
          {value === null ? "—" : value.toLocaleString("pt-BR")}
        </p>
        {caption && <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>}
      </CardContent>
    </Card>
  );
}

function DailyBars({ metrics }: { metrics: MerchantMetrics }) {
  const points = metrics.daily;
  const heights = barHeights(points.map((p) => p.profile_view));
  const total = points.reduce((sum, p) => sum + p.profile_view, 0);
  return (
    <div>
      <div
        className="flex items-end gap-px h-32"
        role="img"
        aria-label={`Visitas por dia nos últimos ${metrics.days} dias: ${total} no total`}
      >
        {points.map((p, i) => (
          <div key={p.day} className="flex-1 h-full flex items-end" title={`${formatDay(p.day)}: ${p.profile_view} visita(s)`}>
            <div
              className={`w-full rounded-t-sm ${p.profile_view > 0 ? "bg-primary" : "bg-muted"}`}
              style={{ height: p.profile_view > 0 ? `${heights[i]}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{points.length > 0 ? formatDay(points[0].day) : ""}</span>
        <span>{points.length > 0 ? formatDay(points[points.length - 1].day) : ""}</span>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const { activeEstablishment, count, isLoading: loadingEstablishments } = useActiveEstablishment();
  const establishmentId = activeEstablishment?.establishment_id;
  const [days, setDays] = useState<PeriodDays>(30);

  const { data: metrics, isLoading: loadingMetrics } = useMerchantMetrics(establishmentId, days);
  const { data: products = [] } = useMerchantProducts(establishmentId);
  const { data: planConfigs = [] } = usePlanConfigs();
  const { data: subscriptions = [] } = useEstablishmentSubscriptions(establishmentId);

  const { data: planName } = useQuery({
    queryKey: ["establishment-plan", establishmentId],
    enabled: !!establishmentId,
    queryFn: async () => {
      const { data } = await supabase.from("establishments").select("plan").eq("id", establishmentId!).maybeSingle();
      return data?.plan ?? "gratuito";
    },
  });

  const plan = getPlanConfig(planConfigs, planName ?? "gratuito");
  const activeSub = subscriptions.find((s) => s.status === "active");
  const pendingSub = subscriptions.find((s) => s.status === "pending");
  const used = products.length;
  const remaining = productsRemaining(plan.max_products, used);
  const atLimit = isAtProductLimit(plan.max_products, used);
  const percent = plan.max_products > 0 ? Math.min(100, Math.round((used / plan.max_products) * 100)) : 0;
  const activePromotions = products.filter((p) => promoOf(p).isActive && p.is_available).length;
  const unavailable = products.filter((p) => !p.is_available).length;

  const metricsUnavailable = !loadingMetrics && metrics === null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Visão geral | Painel do comerciante</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Visão geral</h1>
            {activeEstablishment && <p className="text-sm text-muted-foreground">{activeEstablishment.establishment.name}</p>}
          </div>
          {count > 1 && <EstablishmentSelector />}
        </div>

        {!loadingEstablishments && !activeEstablishment && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Você ainda não tem uma empresa aprovada. <Link to="/cadastrar" className="text-primary underline">Cadastre sua empresa</Link>.
            </CardContent>
          </Card>
        )}

        {activeEstablishment && (
          <>
            {/* Atalhos */}
            <nav aria-label="Atalhos" className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link to={`${MERCHANT_COMPANY}?aba=produtos`}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Cadastrar produto
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={MERCHANT_COMPANY}>
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Editar minha empresa
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`${MERCHANT_COMPANY}?aba=funcoes`}>
                  <Tag className="h-4 w-4" aria-hidden="true" /> Criar promoção
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/estabelecimento/${establishmentId}`}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver minha página
                </Link>
              </Button>
            </nav>

            {/* Números do período */}
            <section aria-labelledby="numeros-titulo" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="numeros-titulo" className="text-lg font-semibold">Visitas e contatos</h2>
                <div className="flex gap-1" role="group" aria-label="Período">
                  {PERIODS.map((p) => (
                    <Button
                      key={p.value}
                      size="sm"
                      variant={days === p.value ? "default" : "outline"}
                      aria-pressed={days === p.value}
                      onClick={() => setDays(p.value)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                  title="Visitas ao perfil"
                  icon={Eye}
                  value={metrics ? totalOf(metrics, "profile_view") : null}
                  caption={metrics ? `${metrics.unique_visitors.toLocaleString("pt-BR")} visitante(s) diferente(s)` : undefined}
                />
                <MetricCard title="Visualizações de produtos" icon={Package} value={metrics ? totalOf(metrics, "product_view") : null} />
                <MetricCard title="Cliques no WhatsApp" icon={MessageCircle} value={metrics ? totalOf(metrics, "whatsapp_click") : null} />
                <MetricCard
                  title="Outros contatos"
                  icon={MousePointerClick}
                  value={metrics ? otherClicks(metrics) : null}
                  caption="Telefone, site, Instagram e rota"
                />
              </div>

              <p className="text-xs text-muted-foreground" aria-live="polite">
                {loadingMetrics && "Carregando números..."}
                {metricsUnavailable && "As estatísticas estão indisponíveis no momento. Tente de novo mais tarde."}
                {metrics && !metrics.first_event_at &&
                  "Ainda não há visitas registradas. Os números aparecem aqui conforme os clientes visitam a sua página."}
                {metrics?.first_event_at &&
                  `Contamos desde ${formatDate(metrics.first_event_at)}. Cada pessoa conta uma vez a cada 30 minutos; as suas próprias visitas e as da equipe não entram.`}
              </p>

              {metrics && metrics.first_event_at && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="h-4 w-4" aria-hidden="true" /> Visitas por dia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DailyBars metrics={metrics} />
                  </CardContent>
                </Card>
              )}

              {metrics && metrics.top_products.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Produtos mais vistos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-1 text-sm">
                      {metrics.top_products.map((p, i) => (
                        <li key={p.id} className="flex justify-between gap-2">
                          <span className="truncate">{i + 1}. {p.name}</span>
                          <span className="text-muted-foreground shrink-0">{p.views} visualização(ões)</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Situação da empresa */}
            <section aria-labelledby="situacao-titulo" className="space-y-3">
              <h2 id="situacao-titulo" className="text-lg font-semibold">Situação da empresa</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" aria-hidden="true" /> Produtos cadastrados
                    </div>
                    <p className="text-3xl font-bold">
                      {used}
                      <span className="text-base font-normal text-muted-foreground"> de {productLimitLabel(plan.max_products)}</span>
                    </p>
                    {plan.max_products > 0 && <Progress value={percent} aria-label="Uso do limite de produtos" className="h-2" />}
                    <p className="text-xs text-muted-foreground">
                      {remaining === null ? "Sem limite." : atLimit ? "Limite atingido." : `${remaining} ainda podem ser cadastrados.`}
                      {unavailable > 0 && ` ${unavailable} indisponível(is).`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" aria-hidden="true" /> Promoções ativas
                    </div>
                    <p className="text-3xl font-bold" aria-label={`Promoções ativas: ${activePromotions}`}>{activePromotions}</p>
                    <p className="text-xs text-muted-foreground">Só contam as que estão dentro da validade.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Crown className="h-4 w-4" aria-hidden="true" /> Plano
                    </div>
                    <p className="text-3xl font-bold">{plan.display_label}</p>
                    {plan.price_cents > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {activeSub?.price_cents != null ? `${formatBRL(activeSub.price_cents)}/mês combinado` : `${formatBRL(plan.price_cents)}/mês`}
                      </p>
                    )}
                    {activeSub?.promo_ends_at && (
                      <p className="text-xs text-muted-foreground">
                        Condição de lançamento até <strong className="text-foreground">{formatDate(activeSub.promo_ends_at)}</strong>. Depois, escolha um plano regular.
                      </p>
                    )}
                    {pendingSub && <Badge variant="secondary">Solicitação em análise</Badge>}
                    <div>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/painel/planos">Ver planos</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
