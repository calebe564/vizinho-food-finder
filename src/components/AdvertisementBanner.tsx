import { useState, useEffect, useCallback, useRef } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Advertisement {
  id: string;
  image: string;
  title: string | null;
  text: string | null;
  link: string | null;
  position?: string;
  size?: string;
  behavior?: string;
  display_order?: number;
}

interface AdvertisementBannerProps {
  advertisements: Advertisement[];
  position?: string;
}

const ADS_PER_SLIDE = 2;
const AUTO_ROTATE_MS = 5000;

export function AdvertisementBanner({ advertisements, position }: AdvertisementBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredAds = position
    ? advertisements.filter(ad => ad.position === position)
    : advertisements;

  const sortedAds = [...filteredAds].sort((a, b) =>
    (a.display_order || 0) - (b.display_order || 0)
  );

  const totalSlides = Math.max(1, Math.ceil(sortedAds.length / ADS_PER_SLIDE));

  const goToNext = useCallback(() => {
    if (isTransitioning || totalSlides <= 1) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev + 1) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [totalSlides, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || totalSlides <= 1) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [totalSlides, isTransitioning]);

  // Auto-rotate
  useEffect(() => {
    if (totalSlides <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(goToNext, AUTO_ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalSlides, goToNext]);

  if (sortedAds.length === 0) return null;

  const getCurrentAds = () => {
    const start = currentSlide * ADS_PER_SLIDE;
    return sortedAds.slice(start, start + ADS_PER_SLIDE);
  };

  const currentAds = getCurrentAds();

  const renderAd = (ad: Advertisement) => {
    const content = (
      <div className="flex items-center gap-2.5 p-2">
        {/* Compact image */}
        <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          <img
            src={ad.image}
            alt={ad.title || "Anúncio"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {ad.title && (
            <p className="text-xs md:text-sm font-semibold text-foreground line-clamp-1">
              {ad.title}
            </p>
          )}
          {ad.text && (
            <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {ad.text}
            </p>
          )}
          {ad.link && (
            <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium mt-0.5">
              Ver mais <ExternalLink className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div
        key={ad.id}
        className="flex-1 min-w-0 rounded-xl overflow-hidden bg-secondary/20 hover:bg-secondary/30 transition-colors border border-border/50"
      >
        {ad.link ? (
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Two ads side by side */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 transition-opacity duration-400 ease-in-out"
        style={{ opacity: isTransitioning ? 0.4 : 1 }}
      >
        {currentAds.map(ad => renderAd(ad))}
      </div>

      {/* Navigation arrows + dots */}
      {totalSlides > 1 && (
        <>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrev}
              className="h-5 w-5 bg-background/70 hover:bg-background rounded-full"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="h-5 w-5 bg-background/70 hover:bg-background rounded-full"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentSlide(idx);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }
                }}
                className={`h-1 rounded-full transition-all ${
                  idx === currentSlide ? "bg-primary w-4" : "bg-border w-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
