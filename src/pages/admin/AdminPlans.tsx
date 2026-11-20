import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { PLAN_CONFIGS_KEY, usePlanConfigs, type PlanConfig } from "@/hooks/usePlanConfig";
import { LAUNCH_CAMPAIGN_KEY, useLaunchCampaign } from "@/hooks/useLaunchCampaign";
import { centsToInput, formatBRL, parseBenefits, parsePriceToCents } from "@/config/plans";

const errorText = (err: unknown) => (err instanceof Error ? err.message : "Não foi possível concluir.");

// ---------------------------------------------------------------- planos
function PlanEditor({ plan }: { plan: PlanConfig }) {
  const client = useQueryClient();
  const [label, setLabel] = useState(plan.display_label);
  const [price, setPrice] = useState(centsToInput(plan.price_cents));
  const [max, setMax] = useState(String(plan.max_products));
  const [description, setDescription] = useState(plan.description);
  const [benefits, setBenefits] = useState(plan.benefits.join("\n"));
  const [order, setOrder] = useState(String(plan.sort_order));
  const [isActive, setIsActive] = useState(plan.is_active);
  const [isPublic, setIsPublic] = useState(plan.is_public);

  const save = useMutation({
    mutationFn: async () => {
      const cents = parsePriceToCents(price);
      const maxProducts = Number(max);
      const sortOrder = Number(order);
      if (!label.trim()) throw new Error("Informe o nome do plano.");
      if (cents === null) throw new Error("Preço inválido. Exemplo: 24,90");
      if (!Number.isInteger(maxProducts) || maxProducts < -1) throw new Error("Limite de produtos inválido (use -1 para ilimitado).");
      if (!Number.isInteger(sortOrder)) throw new Error("Ordem inválida.");

      const { error } = await supabaseUntyped
        .from("plan_configurations")
        .update({
          display_label: label.trim().slice(0, 40),
          price_cents: cents,
          max_products: maxProducts,
          description: description.trim().slice(0, 200),
          benefits: parseBenefits(benefits),
          sort_order: sortOrder,
          is_active: isActive,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("plan_name", plan.plan_name);
      if (error) throw new Error("Você não tem permissão para alterar planos ou o banco não respondeu.");
    },
    onSuccess: () => {
      toast.success(`Plano ${label} salvo`);
      client.invalidateQueries({ queryKey: PLAN_CONFIGS_KEY });
      client.invalidateQueries({ queryKey: LAUNCH_CAMPAIGN_KEY });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {plan.display_label}
          <code className="text-xs font-normal text-muted-foreground">{plan.plan_name}</code>
          {!plan.is_public && <Badge variant="secondary">não é vendido</Badge>}
          {!plan.is_active && <Badge variant="outline">desativado</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor={`label-${plan.plan_name}`}>Nome</Label>
            <Input id={`label-${plan.plan_name}`} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
          </div>
          <div>
            <Label htmlFor={`price-${plan.plan_name}`}>Preço por mês (R$)</Label>
            <Input id={`price-${plan.plan_name}`} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor={`max-${plan.plan_name}`}>Limite de produtos</Label>
            <Input id={`max-${plan.plan_name}`} value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div>
          <Label htmlFor={`desc-${plan.plan_name}`}>Descrição curta</Label>
          <Input id={`desc-${plan.plan_name}`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </div>
        <div>
          <Label htmlFor={`ben-${plan.plan_name}`}>Benefícios (um por linha)</Label>
          <Textarea id={`ben-${plan.plan_name}`} rows={6} value={benefits} onChange={(e) => setBenefits(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch id={`act-${plan.plan_name}`} checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor={`act-${plan.plan_name}`}>Ativo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id={`pub-${plan.plan_name}`} checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor={`pub-${plan.plan_name}`}>Aparece na página de planos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`ord-${plan.plan_name}`}>Ordem</Label>
            <Input id={`ord-${plan.plan_name}`} className="w-20" value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" />
          </div>
          <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar plano"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------- campanha
interface CampaignRow {
  id: string;
  name: string;
  is_active: boolean;
  spots_total: number;
  promo_price_cents: number;
  promo_months: number;
  plan_name: string;
}

function CampaignEditor() {
  const client = useQueryClient();
  const { data: live } = useLaunchCampaign();
  const { data: plans = [] } = usePlanConfigs();

  const { data: row } = useQuery({
    queryKey: ["launch-campaign-row"],
    queryFn: async (): Promise<CampaignRow | null> => {
      const { data } = await supabaseUntyped
        .from("launch_campaigns")
        .select("id, name, is_active, spots_total, promo_price_cents, promo_months, plan_name")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      return (data as CampaignRow) ?? null;
    },
  });

  const [spots, setSpots] = useState("50");
  const [price, setPrice] = useState("15,00");
  const [months, setMonths] = useState("3");
  const [planName, setPlanName] = useState("start");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!row) return;
    setSpots(String(row.spots_total));
    setPrice(centsToInput(row.promo_price_cents));
    setMonths(String(row.promo_months));
    setPlanName(row.plan_name);
    setActive(row.is_active);
  }, [row]);

  const save = useMutation({
    mutationFn: async () => {
      if (!row) throw new Error("Campanha não encontrada.");
      const cents = parsePriceToCents(price);
      const total = Number(spots);
      const m = Number(months);
      if (cents === null) throw new Error("Preço promocional inválido.");
      if (!Number.isInteger(total) || total < 0) throw new Error("Número de vagas inválido.");
      if (!Number.isInteger(m) || m < 1) throw new Error("Duração inválida.");
      const used = live?.spots_used ?? 0;
      if (total < used) throw new Error(`Já existem ${used} adesões; o total de vagas não pode ser menor.`);
      const { error } = await supabaseUntyped
        .from("launch_campaigns")
        .update({ spots_total: total, promo_price_cents: cents, promo_months: m, plan_name: planName, is_active: active, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw new Error("Você não tem permissão para alterar a campanha ou o banco não respondeu.");
    },
    onSuccess: () => {
      toast.success("Campanha salva");
      client.invalidateQueries({ queryKey: LAUNCH_CAMPAIGN_KEY });
      client.invalidateQueries({ queryKey: ["launch-campaign-row"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (!row) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Campanha de lançamento indisponível (o banco não respondeu ou a migration ainda não foi aplicada).
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4" aria-hidden="true" /> {row.name}
        </CardTitle>
        <CardDescription>
          {live
            ? `${live.spots_used} de ${live.spots_total} vagas usadas (${live.spots_remaining} restantes). Os números vêm das adesões reais.`
            : "Sem números ao vivo."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="c-spots">Total de vagas</Label>
            <Input id="c-spots" value={spots} onChange={(e) => setSpots(e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <Label htmlFor="c-price">Valor promocional (R$/mês)</Label>
            <Input id="c-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="c-months">Duração (meses)</Label>
            <Input id="c-months" value={months} onChange={(e) => setMonths(e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <Label htmlFor="c-plan">Plano da promoção</Label>
            <select
              id="c-plan"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {plans.filter((p) => p.is_public).map((p) => (
                <option key={p.plan_name} value={p.plan_name}>
                  {p.display_label} ({formatBRL(p.price_cents)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="c-active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="c-active">Campanha ativa</Label>
          </div>
          <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar campanha"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------- solicitações
interface SubRow {
  id: string;
  establishment_id: string;
  plan_name: string;
  status: string;
  wants_launch_offer: boolean;
  price_cents: number | null;
  promo_ends_at: string | null;
  created_at: string;
  establishments: { name: string } | null;
}

function RequestRow({ sub, planLabel }: { sub: SubRow; planLabel: string }) {
  const client = useQueryClient();
  const [applyOffer, setApplyOffer] = useState(sub.wants_launch_offer);

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    client.invalidateQueries({ queryKey: LAUNCH_CAMPAIGN_KEY });
  };

  const activate = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseUntyped.rpc("activate_subscription", {
        _subscription_id: sub.id,
        _apply_launch_offer: applyOffer,
      });
      if (error) throw new Error(error.message.replace(/^.*?:\s*/, "") || "Não foi possível ativar.");
    },
    onSuccess: () => { toast.success("Plano ativado"); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const note = window.prompt("Motivo da recusa (opcional):") ?? "";
      const { error } = await supabaseUntyped.rpc("reject_subscription", { _subscription_id: sub.id, _note: note });
      if (error) throw new Error("Não foi possível recusar.");
    },
    onSuccess: () => { toast.success("Solicitação recusada"); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{sub.establishments?.name ?? "Empresa"}</p>
        <p className="text-xs text-muted-foreground">
          Pediu {planLabel} em {new Date(sub.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>
      {sub.wants_launch_offer && (
        <div className="flex items-center gap-2">
          <Checkbox id={`offer-${sub.id}`} checked={applyOffer} onCheckedChange={(v) => setApplyOffer(v === true)} />
          <Label htmlFor={`offer-${sub.id}`} className="text-xs">Aplicar condição de lançamento</Label>
        </div>
      )}
      <Button size="sm" onClick={() => activate.mutate()} disabled={activate.isPending || reject.isPending}>Ativar</Button>
      <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={activate.isPending || reject.isPending}>Recusar</Button>
    </li>
  );
}

function Requests() {
  const client = useQueryClient();
  const { data: plans = [] } = usePlanConfigs();
  const labelOf = (name: string) => plans.find((p) => p.plan_name === name)?.display_label ?? name;

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async (): Promise<SubRow[]> => {
      const { data, error } = await supabaseUntyped
        .from("subscriptions")
        .select("id, establishment_id, plan_name, status, wants_launch_offer, price_cents, promo_ends_at, created_at, establishments(name)")
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as SubRow[];
    },
  });

  const expire = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseUntyped.rpc("expire_launch_promos");
      if (error) throw new Error("Não foi possível encerrar as promoções.");
      return Number(data ?? 0);
    },
    onSuccess: (n) => {
      toast.success(n === 0 ? "Nenhuma promoção vencida." : `${n} promoção(ões) encerrada(s).`);
      client.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const end = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseUntyped.rpc("end_subscription", { _subscription_id: id, _new_status: "cancelled" });
      if (error) throw new Error("Não foi possível encerrar o plano.");
    },
    onSuccess: () => { toast.success("Plano encerrado"); client.invalidateQueries({ queryKey: ["admin-subscriptions"] }); },
    onError: (e) => toast.error(errorText(e)),
  });

  const pending = subs.filter((s) => s.status === "pending");
  const active = subs.filter((s) => s.status === "active");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Solicitações de plano ({pending.length})</CardTitle>
          <CardDescription>
            Não há cobrança automática. Combine o pagamento com o comerciante e depois ative o plano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-label="Carregando" />
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((s) => <RequestRow key={s.id} sub={s} planLabel={labelOf(s.plan_name)} />)}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Planos ativos ({active.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => expire.mutate()} disabled={expire.isPending}>
            Encerrar promoções vencidas
          </Button>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano ativo.</p>
          ) : (
            <ul className="space-y-2">
              {active.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm">
                  <span className="font-medium flex-1 min-w-0 truncate">{s.establishments?.name ?? "Empresa"}</span>
                  <Badge variant="secondary">{labelOf(s.plan_name)}</Badge>
                  <span className="text-muted-foreground">{s.price_cents != null ? `${formatBRL(s.price_cents)}/mês` : ""}</span>
                  {s.promo_ends_at && (
                    <span className="text-xs text-muted-foreground">promoção até {new Date(s.promo_ends_at).toLocaleDateString("pt-BR")}</span>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => window.confirm("Encerrar este plano? A empresa volta para \"sem plano\".") && end.mutate(s.id)}>
                    Encerrar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ página
export default function AdminPlans() {
  const { data: plans = [] } = usePlanConfigs();
  const ordered = [...plans].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Planos e campanha</h2>
        <p className="text-sm text-muted-foreground">
          Preços, limites e benefícios dos planos, a campanha de lançamento e as solicitações dos comerciantes.
          O plano não altera a ordem dos resultados de busca.
        </p>
      </div>

      <Requests />
      <CampaignEditor />

      <section aria-labelledby="planos-titulo" className="space-y-4">
        <h3 id="planos-titulo" className="text-lg font-semibold">Planos</h3>
        {ordered.map((plan) => (
          <PlanEditor key={`${plan.plan_name}-${plan.price_cents}-${plan.max_products}`} plan={plan} />
        ))}
      </section>
    </div>
  );
}
