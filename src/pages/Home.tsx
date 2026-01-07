import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SearchBar } from "@/components/SearchBar";
import { FilterSheet } from "@/components/FilterSheet";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { EstablishmentCardCompact } from "@/components/EstablishmentCardCompact";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { TalkToAdminButton } from "@/components/TalkToAdminButton";
import { useUserLocation } from "@/contexts/LocationContext";
import { useSearchParams } from "react-router-dom";
import { Store, Loader2 } from "lucide-react";
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
  if (estNeighborhood && userNeighborhood && estNeighborhood.includes(userNeighborhood)) return 1;
  if (estRegion && userRegion && estRegion.includes(userRegion)) return 2;
  if (estCity && userCity && estCity.includes(userCity)) return 3;
  return 4;
}

function getProximityLabel(score: number): string {
  switch (score) {
    case 1: return "No seu bairro";
    case 2: return "Na sua região";
    case 3: return "Na sua cidade";
    default: return "";
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
  
  const { locationDetails, hasPermission, isLoading: locationLoading } = useUserLocation();

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
        const matchesSearch = !searchTerm || est.name.toLowerCase().includes(searchLower) || est.category.toLowerCase().includes(searchLower) || getEstablishmentProducts(est.id).some((p) => p.name.toLowerCase().includes(searchLower));
        const matchesCategory = category === "todos" || est.category === category;
        return matchesSearch && matchesCategory;
      })
      .map((est) => ({
        ...est,
        proximityScore: calculateProximityScore(est, selectedLocation),
        proximityLabel: getProximityLabel(calculateProximityScore(est, selectedLocation))
      }))
      .sort((a, b) => {
        if (a.is_paid !== b.is_paid) return a.is_paid ? -1 : 1;
        if (sortBy === "proximity") return a.proximityScore - b.proximityScore;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name, 'pt-BR');
        if (sortBy === "name-desc") return b.name.localeCompare(a.name, 'pt-BR');
        return 0;
      });
  }, [establishments, searchTerm, category, sortBy, selectedLocation, products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-4 md:py-6 space-y-4 md:space-y-6">
        <AdvertisementBanner advertisements={getAdsByPosition("top")} />
        
        {/* Hero Carousel */}
        <div className="animate-fade-in">
          <HeroCarousel />
        </div>

        {/* Search Bar */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        {/* Inline Filters */}
        <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <FilterSheet category={category} onCategoryChange={setCategory} sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {/* Establishments List */}
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
          ) : isMobile ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredEstablishments.map((est) => (
                <EstablishmentCardCompact key={est.id} id={est.id} name={est.name} category={est.category} proximityLabel={est.proximityLabel} profileImage={est.profile_image} bannerImage={est.banner_image} isPaid={est.is_paid} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEstablishments.map((est) => (
                <EstablishmentCard key={est.id} id={est.id} name={est.name} category={est.category} address={est.address} proximityLabel={est.proximityLabel} phone={est.phone} whatsapp={est.whatsapp} externalLink={est.external_link} schedule={est.schedule} profileImage={est.profile_image} bannerImage={est.banner_image} images={Array.isArray(est.images) ? est.images as string[] : null} isPaid={est.is_paid} products={getEstablishmentProducts(est.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <TalkToAdminButton />
      <Footer />
    </div>
  );
}
