import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Establishment {
  id: string;
  name: string;
  category: string;
  profile_image: string | null;
  banner_image: string | null;
}

const categoryLabels: Record<string, string> = {
  restaurante: "Restaurante",
  lanchonete: "Lanchonete",
  padaria: "Padaria",
  supermercado: "Supermercado",
  açougue: "Açougue",
  hortifruti: "Hortifruti",
  pizzaria: "Pizzaria",
  hamburgueria: "Hamburgueria",
  bar: "Bar",
  cafe: "Café",
  outro: "Outro"
};

export function BannerCarousel() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPaidEstablishments();
  }, []);

  useEffect(() => {
    if (establishments.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % establishments.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [establishments.length]);

  const fetchPaidEstablishments = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("id, name, category, profile_image, banner_image")
      .eq("is_paid", true)
      .eq("active", true);

    if (!error && data) {
      setEstablishments(data);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + establishments.length) % establishments.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % establishments.length);
  };

  if (establishments.length === 0) {
    return null;
  }

  const current = establishments[currentIndex];

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-elevated bg-gradient-to-br from-primary/20 to-primary/5">
      <Link to={`/estabelecimento/${current.id}`} className="block w-full h-full">
        <div className="relative w-full h-full flex items-center justify-center p-6">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/20" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex-shrink-0">
              {current.profile_image ? (
                <img
                  src={current.profile_image}
                  alt={current.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-lg border-4 border-background"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg border-4 border-background">
                  <Store className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full mb-2">
                ⭐ Destaque
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{current.name}</h3>
              <p className="text-muted-foreground text-lg capitalize">{categoryLabels[current.category] || current.category}</p>
            </div>
            
            {/* CTA Button */}
            <div className="flex-shrink-0">
              <Button size="lg" className="rounded-xl shadow-lg">
                Ver Empresa
              </Button>
            </div>
          </div>
        </div>
      </Link>

      {establishments.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.preventDefault(); goToPrevious(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-md"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.preventDefault(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-md"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {establishments.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-primary w-6" : "bg-primary/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
