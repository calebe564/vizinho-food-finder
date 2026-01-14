import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SearchBar } from "@/components/SearchBar";
import { FilterSheet } from "@/components/FilterSheet";
import { EstablishmentCardCompact } from "@/components/EstablishmentCardCompact";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";

import { useUserLocation } from "@/contexts/LocationContext";
import { useSearchParams } from "react-router-dom";
import { Store, Loader2, Building2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Establishment {
  id: string;
  name: string;
  category: string;
  address: string;
  neighborhood: string | null;
  region: string | null;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string | null;
  external_link: string | null;
  schedule: string;
  profile_image: string | null;
  banner_image: string | null;
  images: unknown;
  is_paid: boolean;
}

interface Product {
  establishment_id: string;
  name: string;
  price: number;
}

interface Advertisement {
  id: string;
  image: string;
  title: string | null;
  text: string | null;
  link: string | null;
  position: string;
  size: string;
  behavior: string;
  display_order: number;
}

interface LocationSelection {
  neighborhood: string;
  region: string;
  city: string;
  state: string;
}

function calculateProximityScore(establishment: Establishment, userLocation: LocationSelection | null): number {
  if (!userLocation) return 999;
  const normalize = (str: string) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";
  const estNeighborhood = normalize(establishment.neighborhood || "");
  const estRegion = normalize(establishment.region || "");
  const estCity = normalize(establishment.city || "");
  const userNeighborhood = normalize(userLocation.neighborhood);
  const userRegion = normalize(userLocation.region);
  const userCity = normalize(userLocation.city);
  
  // Check exact or partial match for neighborhood
  if (estNeighborhood && userNeighborhood) {
    if (estNeighborhood === userNeighborhood || estNeighborhood.includes(userNeighborhood) || userNeighborhood.includes(estNeighborhood)) {
      return 1;
    }
  }
  
  // Check region match
  if (estRegion && userRegion) {
    if (estRegion === userRegion || estRegion.includes(userRegion) || userRegion.includes(estRegion)) {
      return 2;
    }
  }
  
  // Check city match
  if (estCity && userCity) {
    if (estCity === userCity || estCity.includes(userCity) || userCity.includes(estCity)) {
      return 3;
    }
  }
  
  return 4;
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"products" | "companies">("products");
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
  const [sortBy, setSortBy] = useState("proximity");
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection | null>(null);
  
  const { locationDetails, hasPermission } = useUserLocation();

  useEffect(() => {
    if (locationDetails && hasPermission && !selectedLocation) {
      setSelectedLocation({
        neighborhood: locationDetails.neighborhood,
        region: locationDetails.region,
        city: locationDetails.city,
        state: locationDetails.state
      });
    }
  }, [locationDetails, hasPermission]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [establishmentsRes, productsRes, adsRes] = await Promise.all([
        supabase.from("establishments").select("*").eq("active", true),
        supabase.from("products").select("establishment_id, name, price"),
        supabase.from("advertisements").select("*").eq("active", true)
      ]);
      if (establishmentsRes.data) setEstablishments(establishmentsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (adsRes.data) setAdvertisements(adsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAdsByPosition = (position: string) => advertisements.filter(ad => ad.position === position);
  const getEstablishmentProducts = (establishmentId: string) => products.filter((p) => p.establishment_id === establishmentId);

  const filteredEstablishments = useMemo(() => {
    return establishments
      .filter((est) => {
        const searchLower = searchTerm.toLowerCase();
        
        if (!searchTerm) {
          // No search term - filter by category only
          return category === "todos" || est.category === category;
        }
        
        // Search based on mode
        if (searchMode === "products") {
          // Search by product name
          const matchesProduct = getEstablishmentProducts(est.id).some((p) => 
            p.name.toLowerCase().includes(searchLower)
          );
          const matchesCategory = category === "todos" || est.category === category;
          return matchesProduct && matchesCategory;
        } else {
          // Search by company name or category
          const matchesName = est.name.toLowerCase().includes(searchLower);
          const matchesCat = est.category.toLowerCase().includes(searchLower);
          const matchesCategoryFilter = category === "todos" || est.category === category;
          return (matchesName || matchesCat) && matchesCategoryFilter;
        }
      })
      .map((est) => ({
        ...est,
        proximityScore: calculateProximityScore(est, selectedLocation),
      }))
      .sort((a, b) => {
        if (a.is_paid !== b.is_paid) return a.is_paid ? -1 : 1;
        if (sortBy === "proximity") return a.proximityScore - b.proximityScore;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name, 'pt-BR');
        if (sortBy === "name-desc") return b.name.localeCompare(a.name, 'pt-BR');
        return 0;
      });
  }, [establishments, searchTerm, searchMode, category, sortBy, selectedLocation, products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-4 md:py-6 space-y-4 md:space-y-6">
        <AdvertisementBanner advertisements={getAdsByPosition("top")} />
        
        {/* Hero Carousel */}
        <div className="animate-fade-in">
          <HeroCarousel />
        </div>

        {/* Search Bar with Toggle */}
        <div className="animate-fade-in space-y-3" style={{ animationDelay: "0.1s" }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          
          {/* Search Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={searchMode === "products" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("products")}
              className="rounded-full gap-2"
            >
              <Package className="h-4 w-4" />
              Buscar Produtos
            </Button>
            <Button
              variant={searchMode === "companies" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("companies")}
              className="rounded-full gap-2"
            >
              <Building2 className="h-4 w-4" />
              Buscar Empresas
            </Button>
          </div>
        </div>

        {/* Inline Filters */}
        <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <FilterSheet category={category} onCategoryChange={setCategory} sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {/* Establishments List - Unified compact grid for all screens */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {loading ? "Carregando..." : `${filteredEstablishments.length} ${filteredEstablishments.length === 1 ? 'empresa' : 'empresas'}`}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filteredEstablishments.length === 0 ? (
            <div className="text-center py-16 bg-secondary rounded-2xl">
              <Store className="h-14 w-14 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filteredEstablishments.map((est) => {
                const estProducts = getEstablishmentProducts(est.id);
                const minPrice = estProducts.length > 0 ? Math.min(...estProducts.map(p => p.price)) : null;
                return (
                  <EstablishmentCardCompact 
                    key={est.id} 
                    id={est.id} 
                    name={est.name} 
                    category={est.category} 
                    profileImage={est.profile_image} 
                    bannerImage={est.banner_image} 
                    isPaid={est.is_paid}
                    neighborhood={est.neighborhood}
                    city={est.city}
                    minPrice={minPrice}
                    productNames={estProducts.slice(0, 2).map(p => p.name)}
                  />
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