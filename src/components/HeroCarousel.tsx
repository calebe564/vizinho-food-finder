import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/contexts/LocationContext";

interface CarouselItem {
  highlightId: string;
  establishmentId: string;
  establishmentName: string;
  category: string;
  bannerImage: string; // from highlight_requests.image_url
  profileImage: string | null; // from establishments.profile_image (logo)
  latitude: number;
  longitude: number;
  approvedAt: string | null;
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

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function HeroCarousel() {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { coordinates } = useUserLocation();

  useEffect(() => {
    fetchApprovedHighlights();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Re-sort when coordinates change
  useEffect(() => {
    if (coordinates && carouselItems.length > 1) {
      setCarouselItems((prev) => sortByProximity([...prev]));
    }
  }, [coordinates]);

  const sortByProximity = (items: CarouselItem[]): CarouselItem[] => {
    if (coordinates) {
      return items.sort((a, b) => {
        const distA = haversineDistance(coordinates.latitude, coordinates.longitude, a.latitude, a.longitude);
        const distB = haversineDistance(coordinates.latitude, coordinates.longitude, b.latitude, b.longitude);
        if (distA !== distB) return distA - distB;
        // Tie-break: most recently approved first
        return (b.approvedAt || "").localeCompare(a.approvedAt || "");
      });
    }
    // No location: sort by approval date desc
    return items.sort((a, b) => (b.approvedAt || "").localeCompare(a.approvedAt || ""));
  };

  const fetchApprovedHighlights = async () => {
    // Fetch ONLY from highlight_requests with status=approved and valid expiration
    const { data: highlights, error } = await supabase
      .from("highlight_requests")
      .select("id, establishment_id, image_url, expires_at, reviewed_at")
      .eq("status", "approved")
      .gte("expires_at", new Date().toISOString());

    if (error || !highlights || highlights.length === 0) {
      setCarouselItems([]);
      return;
    }

    // Fetch establishment data for these highlights
    const estIds = [...new Set(highlights.map((h) => h.establishment_id))];
    const { data: establishments } = await supabase
      .from("establishments")
      .select("id, name, category, profile_image, latitude, longitude")
      .eq("active", true)
      .in("id", estIds);

    if (!establishments) {
      setCarouselItems([]);
      return;
    }

    const estMap = new Map(establishments.map((e) => [e.id, e]));

    const items: CarouselItem[] = highlights
      .map((h) => {
        const est = estMap.get(h.establishment_id);
        if (!est) return null;
        return {
          highlightId: h.id,
          establishmentId: est.id,
          establishmentName: est.name,
          category: est.category,
          bannerImage: h.image_url, // ONLY from highlight_requests
          profileImage: est.profile_image, // Logo - SEPARATE, never replaced
          latitude: Number(est.latitude) || 0,
          longitude: Number(est.longitude) || 0,
          approvedAt: h.reviewed_at,
        };
      })
      .filter(Boolean) as CarouselItem[];

    setCarouselItems(sortByProximity(items));
  };

  const itemsPerSlide = isMobile ? 1 : 2;
  const totalSlides = Math.max(1, Math.ceil(carouselItems.length / itemsPerSlide));

  const goToNext = useCallback(() => {
    if (carouselItems.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [carouselItems.length, totalSlides, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (carouselItems.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [carouselItems.length, totalSlides, isTransitioning]);

  // Auto-advance
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(goToNext, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [carouselItems.length, isHovered, goToNext]);

  if (carouselItems.length === 0) return null;

  const getCurrentSlideItems = () => {
    const startIdx = currentIndex * itemsPerSlide;
    const items: CarouselItem[] = [];
    for (let i = 0; i < itemsPerSlide; i++) {
      const idx = (startIdx + i) % carouselItems.length;
      if (carouselItems[idx]) items.push(carouselItems[idx]);
    }
    return items;
  };

  const currentSlideItems = getCurrentSlideItems();

  const renderCard = (item: CarouselItem, heightClass: string) => (
    <Link
      key={`${item.highlightId}-${currentIndex}`}
      to={`/estabelecimento/${item.establishmentId}`}
      className="block group"
    >
      <div className="space-y-2">
        {/* Banner image - 100% clean, NO text overlay */}
        <div className={`relative ${heightClass} rounded-2xl overflow-hidden shadow-card`}>
          <img
            src={item.bannerImage}
            alt={`Destaque ${item.establishmentName}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Info block BELOW the image */}
        <div className="flex items-center gap-2.5 px-1">
          {item.profileImage ? (
            <img
              src={item.profileImage}
              alt={item.establishmentName}
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover border border-border flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-border flex-shrink-0">
              <Store className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-medium text-foreground line-clamp-1">
              {item.establishmentName}
            </h3>
            <p className="text-xs text-muted-foreground capitalize line-clamp-1">
              {categoryLabels[item.category] || item.category}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] md:text-xs font-medium rounded-full flex-shrink-0">
            <Star className="h-3 w-3" />
            Destaque
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mobile: Single card */}
      <div className="md:hidden relative overflow-hidden">
        <div
          className="transition-opacity duration-500 ease-in-out"
          style={{ opacity: isTransitioning ? 0.5 : 1 }}
        >
          {currentSlideItems[0] && renderCard(currentSlideItems[0], "h-[100px] sm:h-[120px]")}
        </div>
      </div>

      {/* Desktop: Two cards side by side */}
      <div className="hidden md:block relative">
        <div
          className="grid md:grid-cols-2 gap-4 transition-opacity duration-500 ease-in-out"
          style={{ opacity: isTransitioning ? 0.5 : 1 }}
        >
          {currentSlideItems.map((item, idx) =>
            renderCard(item, "h-[140px] lg:h-[160px]")
          )}
        </div>

        {totalSlides > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-[70px] lg:top-[80px] -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full h-10 w-10 shadow-md"
              onClick={(e) => { e.preventDefault(); goToPrev(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-[70px] lg:top-[80px] -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full h-10 w-10 shadow-md"
              onClick={(e) => { e.preventDefault(); goToNext(); }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Dots indicator */}
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
