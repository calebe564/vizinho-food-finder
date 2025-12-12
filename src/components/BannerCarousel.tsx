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
  favorite_images: string[] | null;
}

interface CarouselItem {
  establishmentId: string;
  establishmentName: string;
  category: string;
  image: string;
  profileImage: string | null;
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
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPaidEstablishments();
  }, []);

  useEffect(() => {
    if (carouselItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const fetchPaidEstablishments = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("id, name, category, profile_image, banner_image, favorite_images")
      .eq("is_paid", true)
      .eq("active", true);

    if (!error && data) {
      // Build carousel items from favorite images
      const items: CarouselItem[] = [];
      data.forEach((est) => {
        const favoriteImages = Array.isArray(est.favorite_images) ? est.favorite_images as string[] : [];
        if (favoriteImages.length > 0) {
          favoriteImages.forEach((img) => {
            items.push({
              establishmentId: est.id,
              establishmentName: est.name,
              category: est.category,
              image: img,
              profileImage: est.profile_image,
            });
          });
        } else if (est.banner_image || est.profile_image) {
          // Fallback to banner/profile image if no favorites
          items.push({
            establishmentId: est.id,
            establishmentName: est.name,
            category: est.category,
            image: est.banner_image || est.profile_image || "",
            profileImage: est.profile_image,
          });
        }
      });
      setCarouselItems(items);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  if (carouselItems.length === 0) {
    return null;
  }

  const current = carouselItems[currentIndex];

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-elevated">
      <Link to={`/estabelecimento/${current.establishmentId}`} className="block w-full h-full">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${current.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {current.profileImage ? (
                <img
                  src={current.profileImage}
                  alt={current.establishmentName}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shadow-lg border-2 border-background"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg border-2 border-background">
                  <Store className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full mb-1">
                ⭐ Destaque
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">{current.establishmentName}</h3>
              <p className="text-muted-foreground text-sm capitalize">{categoryLabels[current.category] || current.category}</p>
            </div>
            
            {/* CTA Button */}
            <div className="flex-shrink-0 hidden md:block">
              <Button size="lg" className="rounded-xl shadow-lg">
                Ver Empresa
              </Button>
            </div>
          </div>
        </div>
      </Link>

      {carouselItems.length > 1 && (
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

          <div className="absolute bottom-4 right-4 flex gap-2">
            {carouselItems.map((_, index) => (
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
