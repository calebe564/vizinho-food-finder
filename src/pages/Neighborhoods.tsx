import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function Neighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("neighborhood")
        .eq("active", true)
        .not("neighborhood", "is", null);

      if (error) throw error;

      // Get unique neighborhoods and sort alphabetically
      const uniqueNeighborhoods = Array.from(
        new Set(data.map((item) => item.neighborhood).filter(Boolean))
      ).sort();

      setNeighborhoods(uniqueNeighborhoods as string[]);
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8 flex items-center justify-center">
          <p>Carregando bairros...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Bairros</h1>
          <p className="text-muted-foreground mb-8">
            Encontre estabelecimentos próximos a você
          </p>

          {neighborhoods.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum bairro cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {neighborhoods.map((neighborhood) => (
                <Link
                  key={neighborhood}
                  to={`/?neighborhood=${encodeURIComponent(neighborhood)}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6 flex items-center gap-3">
                      <div className="p-3 rounded-full bg-muted text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold">{neighborhood}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
