// Utilitário de normalização de localização
// Trata bairros equivalentes como uma única entidade lógica

// Mapa de equivalências de bairros - bairros com variações são agrupados
// EXPANDIDO: inclui todas as variações conhecidas para garantir normalização correta
const NEIGHBORHOOD_EQUIVALENCES: Record<string, string[]> = {
  // Vila Pinho - TODAS as variações devem ser tratadas como uma só
  'vila pinho': [
    'vila pinho', 'vilapinho', 'vila pinho (barreiro)', 'vila pinho - barreiro',
    'vila pinho – barreiro', 'vila pinho - vale do jatoba', 'vila pinho – vale do jatoba',
    'vila pinho vale do jatoba', 'vila pinho (vale do jatoba)', 'vila pinho/barreiro',
    'vila pinho vale do jatobá', 'vila pinho vale do jatobá (barreiro)'
  ],
  // Vila Pim - variações similares
  'vila pim': [
    'vila pim', 'vilapim', 'vilapim (barreiro)', 'vilapim - vale do jatoba', 
    'vilapim – vale do jatoba', 'vilapim vale do jatoba'
  ],
  // Barreiro e variações
  'barreiro': [
    'barreiro', 'barreiro de baixo', 'barreiro de cima', 'centro barreiro',
    'centro do barreiro', 'barreiro centro', 'bairro barreiro'
  ],
  // Vale do Jatobá
  'vale do jatoba': [
    'vale do jatoba', 'vale do jatobá', 'vale jatoba', 'vale jatobá',
    'jatoba', 'jatobá'
  ],
  // Centro e variações
  'centro': ['centro', 'centro-sul', 'centro sul', 'hipercentro', 'centro de bh'],
  // Savassi e região
  'savassi': ['savassi', 'funcionarios', 'funcionários', 'funcionario', 'bairro funcionarios'],
  // Pampulha e região
  'pampulha': [
    'pampulha', 'ouro preto', 'jardim atlantico', 'jardim atlântico',
    'bairro pampulha', 'regiao pampulha', 'região pampulha'
  ],
  // Venda Nova
  'venda nova': ['venda nova', 'venda-nova', 'vendanova', 'regiao venda nova', 'região venda nova'],
  // Belo Horizonte cidade
  'belo horizonte': ['bh', 'belo horizonte', 'belohorizonte', 'b.h.', 'b.h'],
  // Contagem
  'contagem': ['contagem', 'cidade industrial', 'eldorado contagem'],
  // Betim
  'betim': ['betim', 'centro de betim'],
  // Castanheira
  'castanheira': [
    'castanheira', 'castanheira (barreiro)', 'castanheira - barreiro',
    'castanheira – barreiro', 'castanheira barreiro'
  ],
  // Santa Rita
  'santa rita': [
    'santa rita', 'santa rita (barreiro)', 'santa rita - barreiro',
    'santa rita – barreiro', 'santa rita barreiro'
  ],
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

// Normaliza bairro da mesma forma que a função do banco de dados
// Remove parênteses, traços e sufixos, mantendo apenas o nome principal
export function normalizeNeighborhoodDB(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  
  let n = raw.toLowerCase();
  // Remove acentos
  n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Remove parênteses e conteúdo
  n = n.replace(/\([^)]*\)/g, '');
  // Remove conteúdo após traço
  n = n.replace(/\s*[-–—]\s*.*$/g, '');
  // Remove caracteres especiais
  n = n.replace(/[^a-z0-9\s]/g, '');
  // Collapse spaces
  n = n.trim().replace(/\s+/g, ' ');
  return n;
}

// Retorna o identificador canônico do bairro
// Usa primeiro o mapa de equivalências, depois fallback para normalização DB
export function getCanonicalNeighborhood(neighborhood: string): string {
  if (!neighborhood || typeof neighborhood !== 'string') return '';
  
  const normalized = normalizeString(neighborhood);
  if (!normalized) return '';
  
  // Busca no mapa de equivalências
  for (const [canonical, variations] of Object.entries(NEIGHBORHOOD_EQUIVALENCES)) {
    for (const variation of variations) {
      const normVariation = normalizeString(variation);
      if (normVariation === normalized) {
        return canonical;
      }
    }
  }
  
  // Busca por inclusão
  for (const [canonical, variations] of Object.entries(NEIGHBORHOOD_EQUIVALENCES)) {
    for (const variation of variations) {
      const normVariation = normalizeString(variation);
      if (normalized.includes(normVariation) || normVariation.includes(normalized)) {
        return canonical;
      }
    }
  }
  
  // Fallback: usar normalização DB (strip parens/dashes)
  return normalizeNeighborhoodDB(neighborhood);
}

// Verifica se dois bairros são equivalentes
// Usa canonical mapping + DB normalization para matching determinístico
export function areNeighborhoodsEquivalent(neighborhood1: string, neighborhood2: string): boolean {
  if (!neighborhood1 || !neighborhood2) return false;
  
  const canonical1 = getCanonicalNeighborhood(neighborhood1);
  const canonical2 = getCanonicalNeighborhood(neighborhood2);
  
  // Se ambos estão vazios após normalização, não são equivalentes
  if (!canonical1 && !canonical2) return false;
  
  // Mesma forma canônica - match definitivo
  if (canonical1 && canonical2 && canonical1 === canonical2) return true;
  
  // Fallback: comparar DB-normalized (strips parens/dashes)
  const dbNorm1 = normalizeNeighborhoodDB(neighborhood1);
  const dbNorm2 = normalizeNeighborhoodDB(neighborhood2);
  if (dbNorm1 && dbNorm2 && dbNorm1 === dbNorm2) return true;
  
  // Last fallback: substring match para casos não mapeados
  const norm1 = normalizeString(neighborhood1);
  const norm2 = normalizeString(neighborhood2);
  if (norm1.length < 3 || norm2.length < 3) return norm1 === norm2;
  
  return norm1.includes(norm2) || norm2.includes(norm1);
}

// Compara usando neighborhood_normalized pré-computado do banco
// Mais rápido e determinístico que comparação textual
export function matchesNormalizedNeighborhood(
  establishmentNormalized: string | null | undefined,
  filterNeighborhood: string
): boolean {
  if (!establishmentNormalized || !filterNeighborhood) return false;
  const filterNorm = normalizeNeighborhoodDB(filterNeighborhood);
  if (!filterNorm) return false;
  
  // Exact match on normalized forms
  if (establishmentNormalized === filterNorm) return true;
  
  // Also check canonical equivalences
  const estCanonical = getCanonicalNeighborhood(establishmentNormalized);
  const filterCanonical = getCanonicalNeighborhood(filterNeighborhood);
  if (estCanonical && filterCanonical && estCanonical === filterCanonical) return true;
  
  // Substring match as final fallback
  if (establishmentNormalized.length >= 3 && filterNorm.length >= 3) {
    return establishmentNormalized.includes(filterNorm) || filterNorm.includes(establishmentNormalized);
  }
  
  return false;
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
