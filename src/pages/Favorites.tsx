import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserLocation } from "@/contexts/LocationContext";
import { calculateDistance } from "@/hooks/useGeolocation";
import { Heart, Store, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  is_paid: boolean;
}

export default function Favorites() {
  const { favorites } = useFavorites();
  const { coordinates } = useUserLocation();

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["favorites-establishments", favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .in("id", favorites)
        .eq("active", true);

      if (error) throw error;
      return (data || []) as Establishment[];
    },
    enabled: favorites.length > 0,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-favorites"],
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

  const establishmentsWithDistance = establishments.map((est) => ({
    ...est,
    distance: coordinates
      ? calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          Number(est.latitude),
          Number(est.longitude)
        )
      : 0,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold">Meus Favoritos</h1>
            </div>
            <p className="text-muted-foreground">
              Empresas que você salvou como favoritas
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20 bg-secondary/30 rounded-2xl animate-fade-in">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Nenhum favorito ainda</p>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Clique no menu ⋮ de uma empresa e selecione "Favoritar"
              </p>
              <Link to="/estabelecimentos">
                <Button className="rounded-xl">
                  <Store className="h-4 w-4 mr-2" />
                  Ver empresas
                </Button>
              </Link>
            </div>
          ) : establishmentsWithDistance.length === 0 ? (
            <div className="text-center py-20 bg-secondary/30 rounded-2xl animate-fade-in">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">
                Algumas empresas favoritas não estão mais disponíveis
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishmentsWithDistance.map((establishment, index) => (
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
