/**
 * Weighted probabilistic ranking system for establishments.
 * 
 * Uses plan weights to create a non-deterministic ranking where
 * higher-paying plans have proportionally more visibility,
 * while free plans still get some exposure.
 * 
 * PLAN WEIGHTS (configurable via plan_configurations table):
 * - PRO: 80 (70-80% chance of top positions)
 * - BASIC: 20 (20-40% chance of appearing before free)
 * - FREE: 5 (5-15% chance of high positions)
 */

export interface WeightedItem {
  id: string;
  plan: string;
  is_promotion?: boolean;
  [key: string]: unknown;
}

export interface PlanWeight {
  plan_name: string;
  visibility_weight: number;
  promotion_boost: number;
}

const DEFAULT_WEIGHTS: Record<string, PlanWeight> = {
  gratuito: { plan_name: "gratuito", visibility_weight: 5, promotion_boost: 1.0 },
  basico: { plan_name: "basico", visibility_weight: 20, promotion_boost: 1.5 },
  pro: { plan_name: "pro", visibility_weight: 80, promotion_boost: 2.5 },
};

/**
 * Get the effective weight for an item based on its plan and promotion status.
 */
function getEffectiveWeight(
  item: WeightedItem,
  planWeights: Record<string, PlanWeight>
): number {
  const planConfig = planWeights[item.plan] || DEFAULT_WEIGHTS["gratuito"];
  let weight = planConfig.visibility_weight;

  // Apply promotion boost if active
  if (item.is_promotion) {
    weight *= planConfig.promotion_boost;
  }

  return weight;
}

/**
 * Seeded pseudo-random number generator for consistent results within a time window.
 * Changes every 5 minutes to create natural rotation.
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

/**
 * Get a time-based seed that changes every 5 minutes.
 * This creates natural rotation of results while keeping
 * consistent ordering within each window.
 */
function getTimeSeed(): number {
  const fiveMinuteWindow = Math.floor(Date.now() / (5 * 60 * 1000));
  return fiveMinuteWindow;
}

/**
 * Apply weighted probabilistic sorting to a pre-sorted array of items.
 * 
 * This function takes items that are ALREADY sorted by primary criteria
 * (open/closed, proximity, etc.) and applies plan-based weight shuffling
 * WITHIN each priority group.
 * 
 * @param items - Items already sorted by primary criteria
 * @param planWeights - Plan weight configurations
 * @param groupBy - Function to determine the priority group of an item
 * @returns Items with weighted probabilistic ordering within groups
 */
export function applyWeightedRanking<T extends WeightedItem>(
  items: T[],
  planWeights?: PlanWeight[],
  groupBy?: (item: T) => string
): T[] {
  if (items.length <= 1) return items;

  // Build weights map
  const weightsMap: Record<string, PlanWeight> = { ...DEFAULT_WEIGHTS };
  if (planWeights) {
    planWeights.forEach(pw => {
      weightsMap[pw.plan_name] = pw;
    });
  }

  const rng = seededRandom(getTimeSeed());

  // If no groupBy, apply weighted sort to the whole array
  if (!groupBy) {
    return weightedShuffle(items, weightsMap, rng);
  }

  // Group items, apply weighted sort within each group, then reassemble
  const groups = new Map<string, T[]>();
  const groupOrder: string[] = [];

  for (const item of items) {
    const group = groupBy(item);
    if (!groups.has(group)) {
      groups.set(group, []);
      groupOrder.push(group);
    }
    groups.get(group)!.push(item);
  }

  const result: T[] = [];
  for (const group of groupOrder) {
    const groupItems = groups.get(group)!;
    result.push(...weightedShuffle(groupItems, weightsMap, rng));
  }

  return result;
}

/**
 * Weighted shuffle: items with higher weights have proportionally
 * higher probability of appearing first.
 * 
 * Uses the "weighted random sampling without replacement" algorithm.
 */
function weightedShuffle<T extends WeightedItem>(
  items: T[],
  planWeights: Record<string, PlanWeight>,
  rng: () => number
): T[] {
  if (items.length <= 1) return items;

  // Calculate keys: key = random^(1/weight) — higher weight = higher key on average
  const keyed = items.map(item => {
    const weight = getEffectiveWeight(item, planWeights);
    const r = Math.max(rng(), 0.0001); // avoid zero
    const key = Math.pow(r, 1 / weight);
    return { item, key };
  });

  // Sort by key descending — highest keys first
  keyed.sort((a, b) => b.key - a.key);

  return keyed.map(k => k.item);
}

/**
 * Select items for the highlight slider using weighted probability.
 * Ensures minimum count by expanding search radius.
 * 
 * @param items - All available highlight items with plan info
 * @param minCount - Minimum number of highlights to show (default 10)
 * @param maxCount - Maximum number to return (default 20)
 * @param planWeights - Plan weight configurations
 * @returns Selected and weighted items for the slider
 */
export function selectHighlights<T extends WeightedItem>(
  items: T[],
  minCount: number = 10,
  maxCount: number = 20,
  planWeights?: PlanWeight[]
): T[] {
  if (items.length === 0) return [];

  const weightsMap: Record<string, PlanWeight> = { ...DEFAULT_WEIGHTS };
  if (planWeights) {
    planWeights.forEach(pw => {
      weightsMap[pw.plan_name] = pw;
    });
  }

  const rng = seededRandom(getTimeSeed());

  // Take up to maxCount items
  const candidates = items.slice(0, Math.max(maxCount, items.length));
  
  // Apply weighted sorting
  const sorted = weightedShuffle(candidates, weightsMap, rng);

  // Return at least minCount (or all available)
  const count = Math.min(Math.max(minCount, sorted.length), maxCount);
  return sorted.slice(0, count);
}
