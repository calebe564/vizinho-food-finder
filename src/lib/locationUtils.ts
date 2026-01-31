// Utilitário de normalização de localização
// Trata bairros equivalentes como uma única entidade lógica

// Mapa de equivalências de bairros - bairros com variações são agrupados
const NEIGHBORHOOD_EQUIVALENCES: Record<string, string[]> = {
  'vilapim': ['vilapim', 'vilapim (barreiro)', 'vilapim - vale do jatoba', 'vilapim – vale do jatoba', 'vila pim'],
  'barreiro': ['barreiro', 'barreiro de baixo', 'barreiro de cima', 'centro barreiro'],
  'centro': ['centro', 'centro-sul', 'centro sul', 'hipercentro'],
  'savassi': ['savassi', 'funcionarios', 'funcionários'],
  'pampulha': ['pampulha', 'ouro preto', 'jardim atlantico', 'jardim atlântico'],
  'venda nova': ['venda nova', 'venda-nova'],
  'bh': ['bh', 'belo horizonte'],
};

// Normaliza string removendo acentos e caracteres especiais
export function normalizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

// Retorna o identificador canônico do bairro
export function getCanonicalNeighborhood(neighborhood: string): string {
  const normalized = normalizeString(neighborhood);
  
  for (const [canonical, variations] of Object.entries(NEIGHBORHOOD_EQUIVALENCES)) {
    if (variations.some(v => normalizeString(v) === normalized || normalized.includes(normalizeString(v)))) {
      return canonical;
    }
  }
  
  // Se não encontrar equivalência, retorna o próprio normalizado
  return normalized;
}

// Verifica se dois bairros são equivalentes
export function areNeighborhoodsEquivalent(neighborhood1: string, neighborhood2: string): boolean {
  if (!neighborhood1 || !neighborhood2) return false;
  
  const canonical1 = getCanonicalNeighborhood(neighborhood1);
  const canonical2 = getCanonicalNeighborhood(neighborhood2);
  
  // Mesma forma canônica
  if (canonical1 === canonical2) return true;
  
  // Verificar se um contém o outro
  const norm1 = normalizeString(neighborhood1);
  const norm2 = normalizeString(neighborhood2);
  
  return norm1.includes(norm2) || norm2.includes(norm1);
}

// Calcula score de proximidade entre duas localizações
export function getProximityScore(
  establishment: { neighborhood?: string | null; region?: string | null; city?: string },
  userLocation: { neighborhood?: string | null; region?: string | null; city?: string | null }
): number {
  if (!userLocation) return 999;
  
  const estNeighborhood = establishment.neighborhood || '';
  const estRegion = establishment.region || '';
  const estCity = establishment.city || '';
  
  const userNeighborhood = userLocation.neighborhood || '';
  const userRegion = userLocation.region || '';
  const userCity = userLocation.city || '';
  
  // Prioridade 1: Mesmo bairro (considerando equivalências)
  if (estNeighborhood && userNeighborhood) {
    if (areNeighborhoodsEquivalent(estNeighborhood, userNeighborhood)) {
      return 1;
    }
  }
  
  // Prioridade 2: Mesma região
  if (estRegion && userRegion) {
    const normEstRegion = normalizeString(estRegion);
    const normUserRegion = normalizeString(userRegion);
    if (normEstRegion === normUserRegion || normEstRegion.includes(normUserRegion) || normUserRegion.includes(normEstRegion)) {
      return 2;
    }
  }
  
  // Prioridade 3: Mesma cidade
  if (estCity && userCity) {
    const normEstCity = normalizeString(estCity);
    const normUserCity = normalizeString(userCity);
    if (normEstCity === normUserCity || normEstCity.includes(normUserCity) || normUserCity.includes(normEstCity)) {
      return 3;
    }
  }
  
  return 4;
}

// Agrupa estabelecimentos por bairro canônico para evitar fragmentação
export function groupByCanonicalNeighborhood<T extends { neighborhood?: string | null }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of items) {
    const canonical = getCanonicalNeighborhood(item.neighborhood || '');
    const existing = groups.get(canonical) || [];
    existing.push(item);
    groups.set(canonical, existing);
  }
  
  return groups;
}

// Retorna lista única de bairros normalizados de uma lista de estabelecimentos
export function getUniqueNeighborhoods(
  establishments: Array<{ neighborhood?: string | null; region?: string | null; city?: string }>
): Array<{ canonical: string; display: string; city: string }> {
  const seen = new Map<string, { display: string; city: string }>();
  
  for (const est of establishments) {
    if (est.neighborhood) {
      const canonical = getCanonicalNeighborhood(est.neighborhood);
      if (!seen.has(canonical)) {
        seen.set(canonical, {
          display: est.neighborhood,
          city: est.city
        });
      }
    }
  }
  
  return Array.from(seen.entries()).map(([canonical, data]) => ({
    canonical,
    display: data.display,
    city: data.city
  }));
}
