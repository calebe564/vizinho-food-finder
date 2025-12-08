import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BannerCarousel } from "@/components/BannerCarousel";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLocation } from "@/contexts/LocationContext";
import { calculateDistance } from "@/hooks/useGeolocation";
import { useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

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

interface Product {
  establishment_id: string;
  name: string;
  price: number;
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
  const [sortBy, setSortBy] = useState("distance");
  const { coordinates, manualLocation, setManualLocation, isLoading: locationLoading } = useLocation();

  useEffect(() => {
    fetchEstablishments();
    fetchProducts();
  }, []);

  const fetchEstablishments = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("*")
      .eq("active", true);

    if (!error && data) {
      setEstablishments(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("establishment_id, name, price");

    if (!error && data) {
      setProducts(data);
    }
  };

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

  const filteredEstablishments = establishments
    .filter((est) => {
      const matchesSearch =
        est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEstablishmentProducts(est.id).some((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        category === "todos" || est.category === category;

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

      <main className="container mx-auto px-4 py-8 space-y-8">
        <BannerCarousel />

        {/* Search Section */}
        <div className="space-y-4">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {manualLocation 
                ? `Buscando em: ${manualLocation}` 
                : "Ordenando por proximidade da sua localização"
              }
            </span>
          </div>
        )}

        {/* Establishments List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {filteredEstablishments.length} {filteredEstablishments.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstablishments.map((est) => (
              <EstablishmentCard
                key={est.id}
                id={est.id}
                name={est.name}
                category={est.category}
                address={est.address}
                distance={est.distance}
                phone={est.phone}
                schedule={est.schedule}
                profileImage={est.profile_image}
                isPaid={est.is_paid}
                products={getEstablishmentProducts(est.id)}
              />
            ))}
          </div>

          {filteredEstablishments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
