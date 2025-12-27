import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Responsive: 1 mobile, 2 tablet, 3 desktop
  const itemsPerView = useMemo(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  useEffect(() => {
    fetchPaidEstablishments();
  }, []);

  useEffect(() => {
    if (carouselItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, carouselItems.length - itemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselItems.length, itemsPerView]);

  const fetchPaidEstablishments = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("id, name, category, profile_image, banner_image, favorite_images")
      .eq("is_paid", true)
      .eq("active", true);

    if (!error && data) {
      // Um slide por empresa - usar banner, primeira imagem favorita, ou profile
      const items: CarouselItem[] = data.map((est) => {
        const favoriteImages = Array.isArray(est.favorite_images) ? est.favorite_images as string[] : [];
        const mainImage = est.banner_image || favoriteImages[0] || est.profile_image || "";
        
        return {
          establishmentId: est.id,
          establishmentName: est.name,
          category: est.category,
          image: mainImage,
          profileImage: est.profile_image,
        };
      }).filter(item => item.image); // Remove itens sem imagem
      
      setCarouselItems(items);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      if (prev <= 0) return Math.max(0, carouselItems.length - itemsPerView);
      return prev - 1;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, carouselItems.length - itemsPerView);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  if (carouselItems.length === 0) {
    return null;
  }

  // Get visible items
  const visibleItems = carouselItems.slice(currentIndex, currentIndex + itemsPerView);
  // Fill remaining slots if needed
  while (visibleItems.length < itemsPerView && carouselItems.length > 0) {
    const idx = visibleItems.length;
    visibleItems.push(carouselItems[idx % carouselItems.length]);
  }

  return (
    <div className="relative w-full">
      {/* Multi-item carousel grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {visibleItems.map((item, idx) => (
          <Link 
            key={`${item.establishmentId}-${idx}`}
            to={`/estabelecimento/${item.establishmentId}`} 
            className="block group"
          >
            <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300">
              {/* Background Image with object-cover to prevent distortion */}
              <img
                src={item.image}
                alt={item.establishmentName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {item.profileImage ? (
                      <img
                        src={item.profileImage}
                        alt={item.establishmentName}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-lg border-2 border-background"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/20 flex items-center justify-center shadow-lg border-2 border-background">
                        <Store className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary text-[10px] md:text-xs font-medium rounded-full mb-0.5">
                      ⭐ Destaque
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-foreground line-clamp-1">{item.establishmentName}</h3>
                    <p className="text-muted-foreground text-xs capitalize line-clamp-1">{categoryLabels[item.category] || item.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation arrows - only show if more items than view */}
      {carouselItems.length > itemsPerView && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-background/90 hover:bg-background text-foreground rounded-full shadow-md h-8 w-8 md:h-10 md:w-10"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-background/90 hover:bg-background text-foreground rounded-full shadow-md h-8 w-8 md:h-10 md:w-10"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: Math.ceil(carouselItems.length / itemsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * itemsPerView)}
                className={`h-1.5 rounded-full transition-all ${
                  Math.floor(currentIndex / itemsPerView) === index 
                    ? "bg-primary w-4" 
                    : "bg-primary/30 w-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}