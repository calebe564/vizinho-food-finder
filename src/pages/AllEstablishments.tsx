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
import { useLocation } from "@/contexts/LocationContext";
import { calculateDistance } from "@/hooks/useGeolocation";
import { MapPin } from "lucide-react";

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
  schedule: string;
  profile_image: string | null;
  is_paid: boolean;
}

export default function AllEstablishments() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("distance");
  const { coordinates, manualLocation, setManualLocation, isLoading: locationLoading } = useLocation();

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["establishments", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("establishments")
        .select("*")
        .eq("active", true);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (selectedCategory && selectedCategory !== "todos") {
        query = query.eq("category", selectedCategory as EstablishmentCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Establishment[];
    },
  });

  // Fetch products for search
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

  // Check if establishment matches manual location filter
  const matchesManualLocation = (est: Establishment) => {
    if (!manualLocation) return true;
    const locationLower = manualLocation.toLowerCase();
    return (
      (est.neighborhood?.toLowerCase().includes(locationLower) || false) ||
      est.city.toLowerCase().includes(locationLower) ||
      est.address.toLowerCase().includes(locationLower)
    );
  };

  // Filter and sort establishments
  const sortedEstablishments = useMemo(() => {
    return establishments
      .filter((est) => {
        // Filter by product name if searching
        if (searchQuery) {
          const matchesProduct = getEstablishmentProducts(est.id).some((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const matchesName = est.name.toLowerCase().includes(searchQuery.toLowerCase());
          if (!matchesProduct && !matchesName) return false;
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Empresas</h1>
          <p className="text-muted-foreground mb-8">
            Encontre empresas próximas a você
          </p>

          <div className="space-y-4 mb-6">
            <SearchBar 
              value={searchQuery}
              onSearch={setSearchQuery}
              locationValue={manualLocation}
              onLocationChange={setManualLocation}
              showLocation={true}
            />
            <FilterBar
              category={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Location Indicator */}
          {!locationLoading && coordinates && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <MapPin className="h-4 w-4" />
              <span>
                {manualLocation 
                  ? `Buscando em: ${manualLocation}` 
                  : "Ordenando por proximidade da sua localização"
                }
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedEstablishments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEstablishments.map((establishment) => (
                <EstablishmentCard
                  key={establishment.id}
                  id={establishment.id}
                  name={establishment.name}
                  category={establishment.category}
                  address={establishment.address}
                  distance={establishment.distance}
                  phone={establishment.phone}
                  schedule={establishment.schedule}
                  profileImage={establishment.profile_image}
                  isPaid={establishment.is_paid}
                  products={getEstablishmentProducts(establishment.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
