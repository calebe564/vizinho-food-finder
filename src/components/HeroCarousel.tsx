import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  outro: "Outro",
  sorveteria: "Sorveteria",
  acai: "Açaí",
  espetinho: "Espetinho",
};

export function HeroCarousel() {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPaidEstablishments();
    
    // Handle resize for responsive
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop shows 2 items per slide, mobile shows 1
  const itemsPerSlide = isMobile ? 1 : 2;
  
  // Calculate total slides needed
  const totalSlides = Math.max(1, Math.ceil(carouselItems.length / itemsPerSlide));

  // Move to next slide
  const goToNext = useCallback(() => {
    if (carouselItems.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [carouselItems.length, totalSlides, isTransitioning]);

  // Move to previous slide
  const goToPrev = useCallback(() => {
    if (carouselItems.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [carouselItems.length, totalSlides, isTransitioning]);

  // TRUE INFINITE CAROUSEL - Always loops seamlessly, never stops
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval - infinite loop
    intervalRef.current = setInterval(() => {
      goToNext();
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [carouselItems.length, isHovered, goToNext]);

  const fetchPaidEstablishments = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("id, name, category, profile_image, banner_image, favorite_images")
      .eq("is_paid", true)
      .eq("active", true);

    if (!error && data) {
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
      }).filter(item => item.image);
      
      setCarouselItems(items);
    }
  };

  if (carouselItems.length === 0) {
    return null;
  }

  // Get items for current slide (proper slide-based grouping)
  const getCurrentSlideItems = () => {
    const startIdx = currentIndex * itemsPerSlide;
    const items: CarouselItem[] = [];
    for (let i = 0; i < itemsPerSlide; i++) {
      // Wrap around for infinite effect
      const idx = (startIdx + i) % carouselItems.length;
      if (carouselItems[idx]) {
        items.push(carouselItems[idx]);
      }
    }
    return items;
  };

  const currentSlideItems = getCurrentSlideItems();

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mobile: Single card with slide transition */}
      <div className="md:hidden relative overflow-hidden">
        <div 
          className="transition-opacity duration-500 ease-in-out"
          style={{ opacity: isTransitioning ? 0.5 : 1 }}
        >
          {currentSlideItems[0] && (
            <Link 
              to={`/estabelecimento/${currentSlideItems[0].establishmentId}`}
              className="block group"
            >
              <div className="relative h-[100px] sm:h-[120px] rounded-2xl overflow-hidden shadow-card">
                <img
                  src={currentSlideItems[0].image}
                  alt={currentSlideItems[0].establishmentName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-hero" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-0.5 line-clamp-1 drop-shadow-lg">
                    {currentSlideItems[0].establishmentName}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/80 mb-2">
                    {categoryLabels[currentSlideItems[0].category] || currentSlideItems[0].category}
                  </p>
                  <Badge className="bg-accent text-accent-foreground shadow-lg text-xs">
                    <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                    Destaque
                  </Badge>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop: Two cards side by side with smooth transition */}
      <div className="hidden md:block relative">
        <div 
          className="grid md:grid-cols-2 gap-4 transition-opacity duration-500 ease-in-out"
          style={{ opacity: isTransitioning ? 0.5 : 1 }}
        >
          {currentSlideItems.map((item, idx) => (
            <Link 
              key={`${item.establishmentId}-${currentIndex}-${idx}`}
              to={`/estabelecimento/${item.establishmentId}`}
              className="block group"
            >
              <div className="relative h-[140px] lg:h-[160px] rounded-2xl overflow-hidden shadow-card">
                <img
                  src={item.image}
                  alt={item.establishmentName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-hero" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-0.5 line-clamp-1 drop-shadow-lg">
                    {item.establishmentName}
                  </h2>
                  <p className="text-sm text-white/80 mb-2">
                    {categoryLabels[item.category] || item.category}
                  </p>
                  <Badge className="bg-accent text-accent-foreground shadow-lg text-xs">
                    <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                    Destaque
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation arrows for desktop */}
        {totalSlides > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
              onClick={(e) => {
                e.preventDefault();
                goToPrev();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
              onClick={(e) => {
                e.preventDefault();
                goToNext();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Dots indicator - proper slide-based indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "bg-primary w-6" 
                  : "bg-border w-2 hover:bg-muted-foreground"
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
