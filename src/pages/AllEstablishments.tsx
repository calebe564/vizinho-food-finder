import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import { useUserLocation } from "@/contexts/LocationContext";
import { calculateDistance } from "@/hooks/useGeolocation";
import { MapPin, Store, Loader2 } from "lucide-react";

type EstablishmentCategory = Database["public"]["Enums"]["establishment_category"];

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

export default function AllEstablishments() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("distance");
  const { coordinates, manualLocation, setManualLocation, isLoading: locationLoading } = useUserLocation();

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
  });

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
    const locationLower = manualLocation.toLowerCase();
    return (
      (est.neighborhood?.toLowerCase().includes(locationLower) || false) ||
      est.city.toLowerCase().includes(locationLower) ||
      est.address.toLowerCase().includes(locationLower)
    );
  };

  const sortedEstablishments = useMemo(() => {
    return establishments
      .filter((est) => {
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesProduct = getEstablishmentProducts(est.id).some((p) =>
            p.name.toLowerCase().includes(searchLower)
          );
          const matchesName = est.name.toLowerCase().includes(searchLower);
          const matchesCategory = est.category.toLowerCase().includes(searchLower);
          if (!matchesProduct && !matchesName && !matchesCategory) return false;
        }
        return matchesManualLocation(est);
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
  }, [establishments, coordinates, manualLocation, sortBy, searchQuery, products]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEstablishments.map((establishment, index) => (
                <div 
                  key={establishment.id}
                  className="animate-fade-in hover-lift"
                  style={{ animationDelay: `${0.05 * (index % 9)}s` }}
                >
                  <EstablishmentCard
                    id={establishment.id}
                    name={establishment.name}
                    category={establishment.category}
                    address={establishment.address}
                    distance={establishment.distance}
                    phone={establishment.phone}
                    whatsapp={establishment.whatsapp}
                    externalLink={establishment.external_link}
                    schedule={establishment.schedule}
                    profileImage={establishment.profile_image}
                    bannerImage={establishment.banner_image}
                    images={Array.isArray(establishment.images) ? establishment.images as string[] : null}
                    isPaid={establishment.is_paid}
                    products={getEstablishmentProducts(establishment.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
