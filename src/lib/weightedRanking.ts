/**
 * Rodízio justo de estabelecimentos.
 *
 * REGRA DE NEGÓCIO: o plano contratado NÃO dá vantagem na ordem dos resultados.
 * Todos os itens têm o mesmo peso. O sorteio (que muda a cada 5 minutos) só serve para
 * dar a todos as mesmas chances de aparecer nas primeiras posições dentro de cada grupo
 * (aberto/fechado, proximidade etc.). Anúncios pagos ficam em espaços próprios, marcados
 * como "Patrocinado", e nunca se misturam à classificação orgânica.
 *
 * Os campos de peso e de promoção por plano foram mantidos nas assinaturas das funções
 * apenas por compatibilidade e são ignorados.
 */

export interface WeightedItem {
  id: string;
  plan: string;
  is_promotion?: boolean;
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
 * Peso efetivo de um item: igual para todos (o plano e a promoção não alteram a ordem).
 */
export const EQUAL_WEIGHT = 1;

function getEffectiveWeight(
  _item: WeightedItem,
  _planWeights: Record<string, PlanWeight>
): number {
  return EQUAL_WEIGHT;
}

/**
 * Gerador pseudoaleatório com semente (mulberry32). A semente passa por uma mistura antes
 * do uso: o gerador antigo era linear e, em janelas de tempo seguidas, repetia quase a mesma
 * ordem por horas, favorecendo sempre os mesmos estabelecimentos.
 */
function seededRandom(seed: number): () => number {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  a = Math.imul(a ^ (a >>> 16), 0x85ebca6b);
  a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35);
  a = (a ^ (a >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
