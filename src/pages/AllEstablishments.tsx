import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { EstablishmentCardCompact } from "@/components/EstablishmentCardCompact";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import { useUserLocation } from "@/contexts/LocationContext";
import { MapPin, Store, Loader2 } from "lucide-react";
import { isOpenNow } from "@/lib/scheduleUtils";
import { areNeighborhoodsEquivalent, matchesNormalizedNeighborhood } from "@/lib/locationUtils";
import { matchesCategory } from "@/lib/sortingUtils";
import { useMainPhotosMap } from "@/hooks/useEstablishmentPhotos";

type EstablishmentCategory = Database["public"]["Enums"]["establishment_category"];

interface Establishment {
  id: string;
  name: string;
  category: string;
  category_2: string | null;
  category_3: string | null;
  address: string;
  neighborhood: string | null;
  neighborhood_normalized: string | null;
  city: string;
  state: string | null;
  phone: string;
  whatsapp: string | null;
  external_link: string | null;
  schedule: string;
  profile_image: string | null;
  banner_image: string | null;
  images: unknown;
  is_paid: boolean;
  has_delivery: boolean | null;
}

export default function AllEstablishments() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("distance");
  const { coordinates, manualLocation, setManualLocation, isLoading: locationLoading } = useUserLocation();

  // Force refetch when component mounts to ensure deleted establishments are removed
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["establishments"] });
    queryClient.invalidateQueries({ queryKey: ["products-search"] });
  }, [queryClient]);

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["establishments", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("establishments")
        .select("*")
        .eq("active", true);

      if (selectedCategory && selectedCategory !== "todos") {
        query = query.eq("category", selectedCategory as EstablishmentCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Establishment[];
    },
    staleTime: 0, // Always refetch to ensure sync
  });

  // Fetch main photos for listed establishments
  const estIds = useMemo(() => establishments.map(e => e.id), [establishments]);
  const { data: mainPhotosMap = {} } = useMainPhotosMap(estIds);

  const { data: products = [] } = useQuery({
    queryKey: ["products-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("establishment_id, name, price");
      if (error) throw error;
      return data || [];
    },
  });

  const getEstablishmentProducts = (establishmentId: string) => {
    return products.filter((p) => p.establishment_id === establishmentId);
  };

  const matchesManualLocation = (est: Establishment) => {
    if (!manualLocation) return true;
    // Usar neighborhood_normalized do banco + fallback para normalização frontend
    return matchesNormalizedNeighborhood(est.neighborhood_normalized, manualLocation) ||
           areNeighborhoodsEquivalent(est.neighborhood || '', manualLocation) ||
           areNeighborhoodsEquivalent(est.city, manualLocation);
  };

  // ORDENAÇÃO COM PRIORIDADES CORRETAS:
  // 1. Localização filtrada (já filtrado pela query ou manualLocation)
  // 2. Aberto/Fechado (Abertos SEMPRE primeiro)
  // 3. Categoria (já filtrado pela query)
  // 4. Proximidade/Nome
  const sortedEstablishments = useMemo(() => {
    // PASSO 1: Filtrar por localização e busca
    const filtered = establishments.filter((est) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesProduct = getEstablishmentProducts(est.id).some((p) =>
          p.name.toLowerCase().includes(searchLower)
        );
        const matchesName = est.name.toLowerCase().includes(searchLower);
        // Busca em todas as categorias (principal + secundárias)
        const matchesCategorySearch = est.category.toLowerCase().includes(searchLower) ||
                                      (est.category_2 && est.category_2.toLowerCase().includes(searchLower)) ||
                                      (est.category_3 && est.category_3.toLowerCase().includes(searchLower));
        
        if (!matchesProduct && !matchesName && !matchesCategorySearch) return false;
      }
      
      // Filtrar por localização manual
      if (!matchesManualLocation(est)) return false;
      
      // Filtrar por categoria selecionada (incluindo categorias secundárias)
      if (selectedCategory && selectedCategory !== 'todos') {
        if (!matchesCategory(est, selectedCategory)) return false;
      }
      
      return true;
    });
    
    // PASSO 2: Ordenar com prioridades corretas
    return filtered
      .map((est) => ({
        ...est,
        isOpen: isOpenNow(est.schedule),
        matchScore: matchesManualLocation(est) ? 0 : 1,
      }))
      .sort((a, b) => {
        // PRIORIDADE 1: Abertos sempre primeiro
        if (a.isOpen && !b.isOpen) return -1;
        if (!a.isOpen && b.isOpen) return 1;
        
        // PRIORIDADE 2: Pagos primeiro (dentro do mesmo status)
        if (a.is_paid !== b.is_paid) return a.is_paid ? -1 : 1;
        
        // PRIORIDADE 3: Ordenação selecionada
        if (sortBy === "distance") {
          return a.matchScore - b.matchScore;
        }
        if (sortBy === "name") return a.name.localeCompare(b.name, 'pt-BR');
        if (sortBy === "price-asc") {
          const aPrice = Math.min(...getEstablishmentProducts(a.id).map((p) => p.price), Infinity);
          const bPrice = Math.min(...getEstablishmentProducts(b.id).map((p) => p.price), Infinity);
          return aPrice - bPrice;
        }
        if (sortBy === "price-desc") {
          const aPrice = Math.max(...getEstablishmentProducts(a.id).map((p) => p.price), 0);
          const bPrice = Math.max(...getEstablishmentProducts(b.id).map((p) => p.price), 0);
          return bPrice - aPrice;
        }
        return 0;
      });
  }, [establishments, manualLocation, sortBy, searchQuery, products, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Empresas</h1>
            </div>
            <p className="text-muted-foreground">
              Encontre empresas próximas a você
            </p>
          </div>

          <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <SearchBar 
              value={searchQuery}
              onSearch={setSearchQuery}
            />
            <FilterBar
              category={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {!locationLoading && coordinates && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full w-fit mb-6">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {manualLocation 
                  ? `Buscando em: ${manualLocation}` 
                  : "Ordenando por proximidade"
                }
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedEstablishments.length === 0 ? (
            <div className="text-center py-20 bg-secondary/30 rounded-2xl animate-fade-in">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros ou busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedEstablishments.map((establishment, index) => {
                return (
                  <div 
                    key={establishment.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${0.03 * (index % 15)}s` }}
                  >
                    <EstablishmentCardCompact
                      id={establishment.id}
                      name={establishment.name}
                      category={establishment.category}
                      profileImage={establishment.profile_image}
                      bannerImage={establishment.banner_image}
                      mainPhotoUrl={mainPhotosMap[establishment.id]}
                      isPaid={establishment.is_paid}
                      neighborhood={establishment.neighborhood}
                      city={establishment.city}
                      state={establishment.state}
                      schedule={establishment.schedule}
                      hasDelivery={establishment.has_delivery ?? false}
                      ratingAverage={(establishment as any).rating_average ?? 0}
                      ratingCount={(establishment as any).rating_count ?? 0}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
