import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Store, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function BannerCarousel() {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const itemsPerView = useMemo(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  useEffect(() => {
    fetchApprovedHighlights();
  }, []);

  const actualItemsPerView = useMemo(() => {
    return Math.min(itemsPerView, carouselItems.length || 1);
  }, [itemsPerView, carouselItems.length]);

  useEffect(() => {
    if (carouselItems.length <= actualItemsPerView) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, carouselItems.length - actualItemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselItems.length, actualItemsPerView]);

  const fetchApprovedHighlights = async () => {
    // Fetch approved highlight requests that haven't expired
    const { data: highlights, error } = await supabase
      .from("highlight_requests")
      .select("id, establishment_id, image_url, expires_at, created_at")
      .eq("status", "approved")
      .not("image_url", "is", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error || !highlights || highlights.length === 0) {
      setCarouselItems([]);
      return;
    }

    // DISTINCT ON establishment_id: keep only the most recent highlight per establishment
    const seenEstablishments = new Set<string>();
    const uniqueHighlights = highlights.filter((h) => {
      if (seenEstablishments.has(h.establishment_id)) return false;
      seenEstablishments.add(h.establishment_id);
      return true;
    });

    // Fetch establishment info for these highlights
    const estIds = uniqueHighlights.map((h) => h.establishment_id);
    const { data: establishments } = await supabase
      .from("establishments")
      .select("id, name, category, profile_image")
      .eq("active", true)
      .in("id", estIds);

    if (!establishments) {
      setCarouselItems([]);
      return;
    }

    const estMap = new Map(establishments.map((e) => [e.id, e]));

    const items: CarouselItem[] = uniqueHighlights
      .map((h) => {
        const est = estMap.get(h.establishment_id);
        if (!est) return null;
        return {
          establishmentId: est.id,
          establishmentName: est.name,
          category: est.category,
          image: h.image_url,
          profileImage: est.profile_image,
        };
      })
      .filter(Boolean) as CarouselItem[];

    setCarouselItems(items);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      if (prev <= 0) return Math.max(0, carouselItems.length - actualItemsPerView);
      return prev - 1;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, carouselItems.length - actualItemsPerView);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  if (carouselItems.length === 0) return null;

  // NEVER duplicate items to fill space — only show actual distinct items
  const visibleItems = carouselItems.slice(currentIndex, currentIndex + actualItemsPerView);

  const gridColsClass =
    carouselItems.length === 1
      ? "grid-cols-1 max-w-md mx-auto"
      : carouselItems.length === 2
        ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="relative w-full">
      <div className={`grid ${gridColsClass} gap-3 md:gap-4`}>
        {visibleItems.map((item, idx) => (
          <Link
            key={`${item.establishmentId}-${currentIndex}-${idx}`}
            to={`/estabelecimento/${item.establishmentId}`}
            className="block group"
          >
            <div className="space-y-2">
              {/* Image - 100% clean, no overlay text */}
              <div className="relative aspect-[3/1] rounded-xl md:rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300">
                <img
                  src={item.image}
                  alt={`Destaque ${item.establishmentName}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Info block below image */}
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
        ))}
      </div>

      {/* Navigation arrows */}
      {carouselItems.length > actualItemsPerView && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-0 top-[calc(50%-1rem)] -translate-y-1/2 -translate-x-2 bg-background/90 hover:bg-background text-foreground rounded-full shadow-md h-8 w-8 md:h-10 md:w-10"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-[calc(50%-1rem)] -translate-y-1/2 translate-x-2 bg-background/90 hover:bg-background text-foreground rounded-full shadow-md h-8 w-8 md:h-10 md:w-10"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: Math.ceil(carouselItems.length / actualItemsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * actualItemsPerView)}
                className={`h-1.5 rounded-full transition-all ${
                  Math.floor(currentIndex / actualItemsPerView) === index
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
