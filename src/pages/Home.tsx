import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BannerCarousel } from "@/components/BannerCarousel";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { useUserLocation } from "@/contexts/LocationContext";
import { calculateDistance } from "@/hooks/useGeolocation";
import { useSearchParams } from "react-router-dom";
import { MapPin, Store, Loader2 } from "lucide-react";

interface Establishment {
  id: string;
  name: string;
  category: string;
  address: string;
  neighborhood: string | null;
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

export default function Home() {
  const [searchParams] = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
  const [sortBy, setSortBy] = useState("distance");
  const [loading, setLoading] = useState(true);
  const { coordinates, manualLocation, setManualLocation, isLoading: locationLoading } = useUserLocation();

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

  const matchesManualLocation = (est: Establishment) => {
    if (!manualLocation) return true;
    const locationLower = manualLocation.toLowerCase();
    return (
      (est.neighborhood?.toLowerCase().includes(locationLower) || false) ||
      est.city.toLowerCase().includes(locationLower) ||
      est.address.toLowerCase().includes(locationLower)
    );
  };

  const filteredEstablishments = establishments
    .filter((est) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        est.name.toLowerCase().includes(searchLower) ||
        est.category.toLowerCase().includes(searchLower) ||
        getEstablishmentProducts(est.id).some((p) =>
          p.name.toLowerCase().includes(searchLower)
        );

      const matchesCategory = category === "todos" || est.category === category;
      const matchesLocation = matchesManualLocation(est);

      return matchesSearch && matchesCategory && matchesLocation;
    })
    .map((est) => ({
      ...est,
      distance: coordinates
        ? calculateDistance(
            coordinates.latitude,
            coordinates.longitude,
            Number(est.latitude),
            Number(est.longitude)
          )
        : 0,
    }))
    .sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "name") return a.name.localeCompare(b.name);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top Advertisements */}
        <AdvertisementBanner advertisements={getAdsByPosition("top")} />

        {/* Banner Carousel */}
        <div className="animate-fade-in">
          <BannerCarousel />
        </div>

        {/* Search Section */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <SearchBar 
            value={searchTerm} 
            onChange={setSearchTerm}
            locationValue={manualLocation}
            onLocationChange={setManualLocation}
            showLocation={true}
          />
          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Location Indicator */}
        {!locationLoading && coordinates && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full w-fit">
            <MapPin className="h-4 w-4 text-primary" />
            <span>
              {manualLocation 
                ? `Buscando em: ${manualLocation}` 
                : "Ordenando por proximidade"
              }
            </span>
          </div>
        )}

        {/* Establishments List */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-6">
            <Store className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">
              {loading ? "Carregando..." : `${filteredEstablishments.length} ${filteredEstablishments.length === 1 ? 'empresa' : 'empresas'}`}
            </h2>
          </div>

          {/* Middle Advertisements */}
          <AdvertisementBanner advertisements={getAdsByPosition("middle")} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEstablishments.length === 0 ? (
            <div className="text-center py-20 bg-secondary/30 rounded-2xl">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros ou busca</p>
            </div>
          ) : (
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
                    distance={est.distance}
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

          {/* Bottom Advertisements */}
          <AdvertisementBanner advertisements={getAdsByPosition("bottom")} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
