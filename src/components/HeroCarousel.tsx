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
        <div className="relative h-[200px] md:h-[320px] rounded-2xl overflow-hidden shadow-card">
          {/* Background Image */}
          <img
            src={currentItem.image}
            alt={currentItem.establishmentName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Dark gradient overlay from bottom */}
          <div className="absolute inset-0 bg-gradient-hero" />
          
          {/* Content - positioned at bottom left */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
              {currentItem.establishmentName}
            </h2>
            
            {/* Category */}
            <p className="text-base md:text-lg text-white/80 mb-3">
              {categoryLabels[currentItem.category] || currentItem.category}
            </p>
            
            {/* Badge */}
            <Badge className="bg-accent text-accent-foreground shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Destaque
            </Badge>
          </div>
        </div>
      </Link>

      {/* Dots indicator - centered below */}
      {carouselItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {carouselItems.map((_, index) => (
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
