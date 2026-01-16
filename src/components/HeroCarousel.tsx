import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    fetchPaidEstablishments();
  }, []);

  // Desktop shows 2 items per slide, mobile shows 1
  const itemsPerSlide = isMobile ? 1 : 2;
  const totalSlides = Math.ceil(carouselItems.length / itemsPerSlide);

  // Infinite carousel - always loops back to start
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) return;

    const interval = setInterval(() => {
      // Always loop - never stop at end
      setCurrentIndex((prev) => {
        if (totalSlides <= 1) return 0;
        return (prev + 1) % totalSlides;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselItems.length, totalSlides, isHovered]);

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

  // Get items for current slide
  const getCurrentSlideItems = () => {
    const start = currentIndex * itemsPerSlide;
    return carouselItems.slice(start, start + itemsPerSlide);
  };

  const currentSlideItems = getCurrentSlideItems();

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mobile: Single card */}
      <div className="md:hidden">
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

      {/* Desktop: Two cards side by side */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {currentSlideItems.map((item) => (
          <Link 
            key={item.establishmentId}
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

      {/* Dots indicator - centered below */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === index
                  ? "bg-primary w-6" 
                  : "bg-border w-2 hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
