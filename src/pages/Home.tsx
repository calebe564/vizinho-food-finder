import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BannerCarousel } from "@/components/BannerCarousel";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { EstablishmentCardCompact } from "@/components/EstablishmentCardCompact";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { LocationSearch } from "@/components/LocationSearch";
import { useUserLocation } from "@/contexts/LocationContext";
import { useSearchParams } from "react-router-dom";
import { MapPin, Store, Loader2, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

interface LocationSelection {
  neighborhood: string;
  region: string;
  city: string;
  state: string;
}

// Calculate proximity score based on hierarchy (lower is closer)
function calculateProximityScore(
  establishment: Establishment,
  userLocation: LocationSelection | null
): number {
  if (!userLocation) return 999;
  
  const normalize = (str: string) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";
  
  const estNeighborhood = normalize(establishment.neighborhood || "");
  const estRegion = normalize(establishment.region || "");
  const estCity = normalize(establishment.city || "");
  
  const userNeighborhood = normalize(userLocation.neighborhood);
  const userRegion = normalize(userLocation.region);
  const userCity = normalize(userLocation.city);
  
  // Same neighborhood = score 1 (highest priority)
  if (estNeighborhood && userNeighborhood && estNeighborhood.includes(userNeighborhood)) {
    return 1;
  }
  
  // Same region = score 2
  if (estRegion && userRegion && estRegion.includes(userRegion)) {
    return 2;
  }
  
  // Same city = score 3
  if (estCity && userCity && estCity.includes(userCity)) {
    return 3;
  }
  
  // Different city = score 4
  return 4;
}

// Get proximity label for display
function getProximityLabel(score: number): string {
  switch (score) {
    case 1: return "No seu bairro";
    case 2: return "Na sua região";
    case 3: return "Na sua cidade";
    default: return "Outras cidades";
  }
}

export default function Home() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
  const [sortBy, setSortBy] = useState("proximity");
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection | null>(null);
  
  const { 
    locationDetails, 
    hasPermission, 
    isLoading: locationLoading 
  } = useUserLocation();

  // Set initial location from user's detected location
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const getAdsByPosition = (position: string) => {
    return advertisements.filter(ad => ad.position === position);
  };

  const getEstablishmentProducts = (establishmentId: string) => {
    return products.filter((p) => p.establishment_id === establishmentId);
  };

  const handleLocationSelect = (location: { neighborhood: string; region: string; city: string; state: string } | null) => {
    setSelectedLocation(location);
  };

  // Filter and sort establishments
  const filteredEstablishments = useMemo(() => {
    return establishments
      .filter((est) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
          est.name.toLowerCase().includes(searchLower) ||
          est.category.toLowerCase().includes(searchLower) ||
          getEstablishmentProducts(est.id).some((p) =>
            p.name.toLowerCase().includes(searchLower)
          );

        const matchesCategory = category === "todos" || est.category === category;

        return matchesSearch && matchesCategory;
      })
      .map((est) => ({
        ...est,
        proximityScore: calculateProximityScore(est, selectedLocation),
        proximityLabel: getProximityLabel(calculateProximityScore(est, selectedLocation))
      }))
      .sort((a, b) => {
        // Paid establishments first
        if (a.is_paid !== b.is_paid) {
          return a.is_paid ? -1 : 1;
        }
        
        if (sortBy === "proximity") {
          return a.proximityScore - b.proximityScore;
        }
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name, 'pt-BR');
        }
        if (sortBy === "name-desc") {
          return b.name.localeCompare(a.name, 'pt-BR');
        }
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
  }, [establishments, searchTerm, category, sortBy, selectedLocation, products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Top Advertisements - compact on mobile */}
        <AdvertisementBanner advertisements={getAdsByPosition("top")} />

        {/* Banner Carousel - hidden on mobile for cleaner experience */}
        <div className="hidden md:block animate-fade-in">
          <BannerCarousel />
        </div>

        {/* Search Section - more compact on mobile */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col lg:flex-row gap-2 md:gap-3">
            <div className="flex-1">
              <SearchBar 
                value={searchTerm} 
                onChange={setSearchTerm}
              />
            </div>
            <div className="lg:w-[350px]">
              <LocationSearch onLocationSelect={handleLocationSelect} />
            </div>
          </div>
          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Location Indicator - smaller on mobile */}
        {!locationLoading && (
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground bg-secondary/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full w-fit">
            {hasPermission && selectedLocation ? (
              <>
                <Navigation className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span>Na sua região</span>
                {selectedLocation.neighborhood && (
                  <Badge variant="secondary" className="ml-1 text-[10px] md:text-xs py-0">
                    {selectedLocation.neighborhood}
                  </Badge>
                )}
              </>
            ) : selectedLocation ? (
              <>
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span className="truncate max-w-[150px] md:max-w-none">
                  {selectedLocation.city || selectedLocation.neighborhood}
                </span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                <span className="hidden md:inline">Informe sua localização para resultados mais relevantes</span>
                <span className="md:hidden">Defina sua localização</span>
              </>
            )}
          </div>
        )}

        {/* Establishments List */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-3 md:mb-6">
            <Store className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h2 className="text-lg md:text-2xl font-bold">
              {loading ? "Carregando..." : `${filteredEstablishments.length} ${filteredEstablishments.length === 1 ? 'empresa' : 'empresas'}`}
            </h2>
          </div>

          {/* Middle Advertisements */}
          {!isMobile && <AdvertisementBanner advertisements={getAdsByPosition("middle")} />}

          {loading ? (
            <div className="flex items-center justify-center py-12 md:py-20">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
            </div>
          ) : filteredEstablishments.length === 0 ? (
            <div className="text-center py-12 md:py-20 bg-secondary/30 rounded-xl md:rounded-2xl">
              <Store className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-3 md:mb-4" />
              <p className="text-base md:text-xl font-medium text-muted-foreground">Nenhuma empresa encontrada</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Tente ajustar os filtros</p>
            </div>
          ) : isMobile ? (
            /* Mobile: Compact 2-column grid */
            <div className="grid grid-cols-2 gap-2.5">
              {filteredEstablishments.map((est, index) => (
                <div 
                  key={est.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.03 * (index % 8)}s` }}
                >
                  <EstablishmentCardCompact
                    id={est.id}
                    name={est.name}
                    category={est.category}
                    proximityLabel={est.proximityLabel}
                    profileImage={est.profile_image}
                    isPaid={est.is_paid}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: Full cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEstablishments.map((est, index) => (
                <div 
                  key={est.id} 
                  className="animate-fade-in hover-lift"
                  style={{ animationDelay: `${0.1 * (index % 6)}s` }}
                >
                  <EstablishmentCard
                    id={est.id}
                    name={est.name}
                    category={est.category}
                    address={est.address}
                    proximityLabel={est.proximityLabel}
                    phone={est.phone}
                    whatsapp={est.whatsapp}
                    externalLink={est.external_link}
                    schedule={est.schedule}
                    profileImage={est.profile_image}
                    bannerImage={est.banner_image}
                    images={Array.isArray(est.images) ? est.images as string[] : null}
                    isPaid={est.is_paid}
                    products={getEstablishmentProducts(est.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bottom Advertisements - only on desktop */}
          {!isMobile && <AdvertisementBanner advertisements={getAdsByPosition("bottom")} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
