import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Store, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    fetchPaidEstablishments();
  }, []);

  useEffect(() => {
    if (carouselItems.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= carouselItems.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselItems.length, isHovered]);

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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev <= 0 ? carouselItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= carouselItems.length - 1 ? 0 : prev + 1));
  };

  if (carouselItems.length === 0) {
    return null;
  }

  const currentItem = carouselItems[currentIndex];

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Hero Slide */}
      <Link 
        to={`/estabelecimento/${currentItem.establishmentId}`}
        className="block group"
      >
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden shadow-elevated">
          {/* Background Image */}
          <img
            src={currentItem.image}
            alt={currentItem.establishmentName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10 lg:p-14">
            <div className="max-w-lg">
              {/* Badge */}
              <Badge className="bg-accent text-accent-foreground shadow-lg mb-3 md:mb-4">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Destaque
              </Badge>
              
              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 line-clamp-2 drop-shadow-lg">
                {currentItem.establishmentName}
              </h2>
              
              {/* Category */}
              <p className="text-base md:text-lg text-white/80 font-medium">
                {categoryLabels[currentItem.category] || currentItem.category}
              </p>
            </div>
            
            {/* Logo overlay */}
            {currentItem.profileImage && (
              <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10">
                <img
                  src={currentItem.profileImage}
                  alt={currentItem.establishmentName}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-elevated border-2 border-white/20"
                />
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Navigation arrows */}
      {carouselItems.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.preventDefault(); goToPrevious(); }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card text-foreground rounded-full shadow-elevated h-10 w-10 md:h-12 md:w-12"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.preventDefault(); goToNext(); }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card text-foreground rounded-full shadow-elevated h-10 w-10 md:h-12 md:w-12"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? "bg-white w-6" 
                    : "bg-white/40 w-2 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
