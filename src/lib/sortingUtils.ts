// Utilitário de ordenação para estabelecimentos
// Implementa regras de prioridade: Localização > Aberto/Fechado > Categoria > Outros

import { isOpenNow } from './scheduleUtils';
import { getCanonicalNeighborhood, areNeighborhoodsEquivalent, getProximityScore } from './locationUtils';

export interface EstablishmentForSort {
  id: string;
  neighborhood?: string | null;
  region?: string | null;
  city: string;
  schedule: string;
  category: string;
  category_2?: string | null;
  category_3?: string | null;
  is_paid?: boolean;
  is_destaque?: boolean;
  plan?: string;
  name: string;
}

export interface UserLocation {
  neighborhood?: string | null;
  region?: string | null;
  city?: string | null;
}

export interface LocationFilter {
  neighborhood: string;
  city: string;
  state: string;
}

// Verifica se estabelecimento corresponde ao filtro de localização
export function matchesLocationFilter(
  establishment: EstablishmentForSort,
  locationFilter: LocationFilter | null
): boolean {
  if (!locationFilter) return true;
  
  // Usar normalização de bairros para matching
  if (locationFilter.neighborhood) {
    return areNeighborhoodsEquivalent(
      establishment.neighborhood || '',
      locationFilter.neighborhood
    );
  }
  
  // Se só tem cidade, filtrar por cidade
  if (locationFilter.city) {
    const normEstCity = (establishment.city || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normFilterCity = locationFilter.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return normEstCity.includes(normFilterCity) || normFilterCity.includes(normEstCity);
  }
  
  return true;
}

// Verifica se estabelecimento corresponde a categoria (incluindo categorias 2 e 3)
export function matchesCategory(
  establishment: EstablishmentForSort,
  categoryFilter: string
): boolean {
  if (!categoryFilter || categoryFilter === 'todos') return true;
  
  const categories = [
    establishment.category,
    establishment.category_2,
    establishment.category_3
  ].filter(Boolean).map(c => c!.toLowerCase());
  
  return categories.includes(categoryFilter.toLowerCase());
}

// Ordenação de estabelecimentos com prioridades corretas
// PRIORIDADE:
// 1. Localização filtrada (PRIMEIRO - estabelecimentos fora do filtro são excluídos, não ordenados depois)
// 2. Status Aberto/Fechado (Abertos SEMPRE primeiro)
// 3. Pagos primeiro (dentro do mesmo status)
// 4. Proximidade (se aplicável)
export function sortEstablishments<T extends EstablishmentForSort>(
  establishments: T[],
  options: {
    locationFilter?: LocationFilter | null;
    userLocation?: UserLocation | null;
    categoryFilter?: string;
    sortBy?: 'proximity' | 'name-asc' | 'name-desc';
  } = {}
): (T & { isOpen: boolean; proximityScore: number })[] {
  const { locationFilter, userLocation, categoryFilter, sortBy = 'proximity' } = options;
  
  // PASSO 1: Filtrar por localização (se houver filtro)
  let filtered = establishments;
  if (locationFilter) {
    filtered = establishments.filter(est => matchesLocationFilter(est, locationFilter));
  }
  
  // PASSO 2: Filtrar por categoria (se houver filtro)
  if (categoryFilter && categoryFilter !== 'todos') {
    filtered = filtered.filter(est => matchesCategory(est, categoryFilter));
  }
  
  // PASSO 3: Adicionar metadados (isOpen, proximityScore)
  const withMetadata = filtered.map(est => {
    const isOpen = isOpenNow(est.schedule);
    const proximityScore = userLocation 
      ? getProximityScore(
          { neighborhood: est.neighborhood, region: est.region, city: est.city },
          { neighborhood: userLocation.neighborhood, region: userLocation.region, city: userLocation.city }
        )
      : 999;
    
    return { ...est, isOpen, proximityScore };
  });
  
  // PASSO 4: Ordenar
  return withMetadata.sort((a, b) => {
    // PRIORIDADE 0: Destaques abertos primeiro
    const aDestaque = a.is_destaque && a.isOpen;
    const bDestaque = b.is_destaque && b.isOpen;
    if (aDestaque && !bDestaque) return -1;
    if (!aDestaque && bDestaque) return 1;

    // PRIORIDADE 1: Abertos sempre primeiro
    if (a.isOpen && !b.isOpen) return -1;
    if (!a.isOpen && b.isOpen) return 1;
    
    // PRIORIDADE 2: Pagos primeiro (dentro do mesmo status de abertura)
    if (a.is_paid !== b.is_paid) {
      return a.is_paid ? -1 : 1;
    }
    
    // PRIORIDADE 3: Ordenação selecionada
    switch (sortBy) {
      case 'proximity': {
        // Mesma localização agrupada
        if (a.proximityScore !== b.proximityScore) {
          return a.proximityScore - b.proximityScore;
        }
        // Dentro da mesma proximidade, agrupar por bairro canônico
        const aCanonical = getCanonicalNeighborhood(a.neighborhood || '');
        const bCanonical = getCanonicalNeighborhood(b.neighborhood || '');
        if (aCanonical !== bCanonical) {
          return aCanonical.localeCompare(bCanonical, 'pt-BR');
        }
        return a.name.localeCompare(b.name, 'pt-BR');
      }

      case 'name-asc':
        return a.name.localeCompare(b.name, 'pt-BR');
        
      case 'name-desc':
        return b.name.localeCompare(a.name, 'pt-BR');
        
      default:
        return 0;
    }
  });
}

// Ordenação para produtos (considera status do estabelecimento)
export interface ProductForSort {
  id: string;
  name: string;
  establishment_neighborhood?: string | null;
  establishment_city?: string | null;
  establishment_schedule?: string;
}

export function sortProducts<T extends ProductForSort>(
  products: T[],
  options: {
    locationFilter?: LocationFilter | null;
    userLocation?: UserLocation | null;
  } = {}
): (T & { isEstablishmentOpen: boolean; proximityScore: number })[] {
  const { locationFilter, userLocation } = options;
  
  // Filtrar por localização se houver
  let filtered = products;
  if (locationFilter) {
    filtered = products.filter(product => {
      if (!locationFilter.neighborhood) return true;
      return areNeighborhoodsEquivalent(
        product.establishment_neighborhood || '',
        locationFilter.neighborhood
      );
    });
  }
  
  // Adicionar metadados
  const withMetadata = filtered.map(product => {
    const isEstablishmentOpen = isOpenNow(product.establishment_schedule || '');
    const proximityScore = userLocation 
      ? getProximityScore(
          { neighborhood: product.establishment_neighborhood, city: product.establishment_city || '' },
          { neighborhood: userLocation.neighborhood, city: userLocation.city }
        )
      : 999;
    
    return { ...product, isEstablishmentOpen, proximityScore };
  });
  
  // Ordenar: Abertos primeiro, depois por proximidade
  return withMetadata.sort((a, b) => {
    // PRIORIDADE 1: Estabelecimentos abertos primeiro
    if (a.isEstablishmentOpen && !b.isEstablishmentOpen) return -1;
    if (!a.isEstablishmentOpen && b.isEstablishmentOpen) return 1;
    
    // PRIORIDADE 2: Proximidade
    if (a.proximityScore !== b.proximityScore) {
      return a.proximityScore - b.proximityScore;
    }
    
    // PRIORIDADE 3: Nome
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}
