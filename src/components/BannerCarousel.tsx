import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Establishment {
  id: string;
  name: string;
  category: string;
  banner_image: string | null;
}

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
      .select("id, name, category, banner_image")
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
    <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-elevated">
      <Link to={`/estabelecimento/${current.id}`}>
        <div className="relative w-full h-full bg-gradient-primary">
          {current.banner_image ? (
            <img
              src={current.banner_image}
              alt={current.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-primary-foreground">{current.name}</h3>
                <p className="text-lg text-primary-foreground/80 mt-2">{current.category}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-2xl font-bold text-white">{current.name}</h3>
            <p className="text-white/90 capitalize">{current.category}</p>
          </div>
        </div>
      </Link>

      {establishments.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {establishments.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-white w-6" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
