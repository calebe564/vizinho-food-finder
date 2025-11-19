import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/contexts/LocationContext";
import { calcularProximidade, getProximityColor, getProximityIcon } from "@/lib/proximityUtils";
import type { ProximityLevel } from "@/lib/proximityUtils";

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

interface EstablishmentWithProximity extends Establishment {
  proximity: ProximityLevel;
}

export default function NearbyEstablishments() {
  const navigate = useNavigate();
  const { userLocation, clearUserLocation } = useLocation();
  const [establishments, setEstablishments] = useState<EstablishmentWithProximity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLocation) {
      navigate("/where-are-you");
      return;
    }

    fetchEstablishments();
  }, [userLocation, navigate]);

  const fetchEstablishments = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("*")
      .eq("active", true);

    if (!error && data) {
      const withProximity = data.map((est) => ({
        ...est,
        proximity: calcularProximidade(est, userLocation),
      }));

      // Ordenar por proximidade
      const sorted = withProximity.sort((a, b) => {
        const order = { "muito perto": 1, "perto": 2, "distante": 3 };
        return order[a.proximity] - order[b.proximity];
      });

      setEstablishments(sorted);
    }
    setLoading(false);
  };

  const handleChangeLocation = () => {
    clearUserLocation();
    navigate("/where-are-you");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando estabelecimentos...</p>
        </div>
      </div>
    );
  }

  const muitoPerto = establishments.filter((e) => e.proximity === "muito perto");
  const perto = establishments.filter((e) => e.proximity === "perto");
  const distante = establishments.filter((e) => e.proximity === "distante");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Estabelecimentos Próximos</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {userLocation?.neighborhood}, {userLocation?.city}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={handleChangeLocation}>
            <Navigation className="h-4 w-4 mr-2" />
            Alterar Localização
          </Button>
        </div>

        {muitoPerto.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">
                {getProximityIcon("muito perto")} Muito Perto ({muitoPerto.length})
              </h2>
              <Badge variant="default" className="bg-green-600">No seu bairro</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {muitoPerto.map((est) => (
                <EstablishmentCard
                  key={est.id}
                  id={est.id}
                  name={est.name}
                  category={est.category}
                  address={est.address}
                  distance={0}
                  phone={est.phone}
                  schedule={est.schedule}
                  profileImage={est.profile_image}
                  isPaid={est.is_paid}
                  products={[]}
                  proximityLabel={est.proximity}
                />
              ))}
            </div>
          </section>
        )}

        {perto.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">
                {getProximityIcon("perto")} Perto ({perto.length})
              </h2>
              <Badge variant="secondary">Na sua cidade</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {perto.map((est) => (
                <EstablishmentCard
                  key={est.id}
                  id={est.id}
                  name={est.name}
                  category={est.category}
                  address={est.address}
                  distance={0}
                  phone={est.phone}
                  schedule={est.schedule}
                  profileImage={est.profile_image}
                  isPaid={est.is_paid}
                  products={[]}
                  proximityLabel={est.proximity}
                />
              ))}
            </div>
          </section>
        )}

        {distante.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">
                {getProximityIcon("distante")} Distante ({distante.length})
              </h2>
              <Badge variant="outline">Outras cidades</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {distante.map((est) => (
                <EstablishmentCard
                  key={est.id}
                  id={est.id}
                  name={est.name}
                  category={est.category}
                  address={est.address}
                  distance={0}
                  phone={est.phone}
                  schedule={est.schedule}
                  profileImage={est.profile_image}
                  isPaid={est.is_paid}
                  products={[]}
                  proximityLabel={est.proximity}
                />
              ))}
            </div>
          </section>
        )}

        {establishments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum estabelecimento encontrado</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
