import { useQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { DEFAULT_PLANS, type PlanDefinition } from "@/config/plans";

/** Configuração de um plano (vinda do banco; usa o plano padrão se o banco não responder). */
export interface PlanConfig extends PlanDefinition {
  // Mantidos por compatibilidade. O plano NÃO influencia a ordem dos resultados.
  visibility_weight: number;
  promotion_boost: number;
}

const withNeutralWeights = (p: PlanDefinition): PlanConfig => ({ ...p, visibility_weight: 1, promotion_boost: 1 });

export const DEFAULT_CONFIGS: PlanConfig[] = DEFAULT_PLANS.map(withNeutralWeights);

const BASE_COLUMNS =
  "plan_name, display_label, price_cents, max_products, description, benefits, sort_order, is_active, is_public, visibility_weight, promotion_boost";
const COLUMNS = `${BASE_COLUMNS}, customization_level`;
const DEFAULT_LEVEL: Record<string, PlanConfig["customization_level"]> = { pro: "basic", max: "advanced" };

export const PLAN_CONFIGS_KEY = ["plan-configurations"] as const;

export function usePlanConfigs() {
  return useQuery({
    queryKey: PLAN_CONFIGS_KEY,
    queryFn: async (): Promise<PlanConfig[]> => {
      let { data, error } = await supabaseUntyped.from("plan_configurations").select(COLUMNS);
      if (error) {
        // a migration da personalização ainda não foi aplicada: busca sem a coluna nova
        ({ data, error } = await supabaseUntyped.from("plan_configurations").select(BASE_COLUMNS));
      }
      if (error || !data || data.length === 0) return DEFAULT_CONFIGS;
      return (data as PlanConfig[]).map((row) => ({
        ...row,
        price_cents: row.price_cents ?? 0,
        benefits: row.benefits ?? [],
        description: row.description ?? "",
        sort_order: row.sort_order ?? 0,
        is_active: row.is_active ?? true,
        is_public: row.is_public ?? true,
        customization_level: row.customization_level ?? DEFAULT_LEVEL[row.plan_name] ?? "none",
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function getPlanConfig(configs: PlanConfig[], planName: string): PlanConfig {
  return (
    configs.find((c) => c.plan_name === planName) ||
    DEFAULT_CONFIGS.find((c) => c.plan_name === "gratuito") ||
    DEFAULT_CONFIGS[0]
  );
}

export function getMaxProducts(configs: PlanConfig[], planName: string): number {
  return getPlanConfig(configs, planName).max_products;
}
