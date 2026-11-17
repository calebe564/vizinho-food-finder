import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanConfig {
  plan_name: string;
  max_products: number;
  visibility_weight: number;
  promotion_boost: number;
  display_label: string;
}

// Default fallback configs
const DEFAULT_CONFIGS: PlanConfig[] = [
  { plan_name: "gratuito", max_products: 5, visibility_weight: 5, promotion_boost: 1.0, display_label: "Free" },
  { plan_name: "basico", max_products: 20, visibility_weight: 20, promotion_boost: 1.5, display_label: "Basic" },
  { plan_name: "pro", max_products: -1, visibility_weight: 80, promotion_boost: 2.5, display_label: "Pro" },
];

export function usePlanConfigs() {
  return useQuery({
    queryKey: ["plan-configurations"],
    queryFn: async (): Promise<PlanConfig[]> => {
      const { data, error } = await supabase
        .from("plan_configurations")
        .select("plan_name, max_products, visibility_weight, promotion_boost, display_label");

      if (error || !data || data.length === 0) {
        return DEFAULT_CONFIGS;
      }

      return data as unknown as PlanConfig[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function getPlanConfig(configs: PlanConfig[], planName: string): PlanConfig {
  return configs.find(c => c.plan_name === planName) || DEFAULT_CONFIGS[0];
}

export function getVisibilityWeight(configs: PlanConfig[], planName: string): number {
  return getPlanConfig(configs, planName).visibility_weight;
}

export function getPromotionBoost(configs: PlanConfig[], planName: string): number {
  return getPlanConfig(configs, planName).promotion_boost;
}

export function getMaxProducts(configs: PlanConfig[], planName: string): number {
  return getPlanConfig(configs, planName).max_products;
}
