import { useState, useEffect } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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

export function AdvertisementBanner({ advertisements, position }: AdvertisementBannerProps) {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter by position if specified
  const filteredAds = position 
    ? advertisements.filter(ad => ad.position === position)
    : advertisements;

  // Sort by display_order
  const sortedAds = [...filteredAds].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );

  // Group ads by behavior
  const carouselAds = sortedAds.filter(ad => ad.behavior === 'carousel' || !ad.behavior || ad.behavior === 'static');
  const fixedAds = sortedAds.filter(ad => ad.behavior === 'fixed');
  const floatingAds = sortedAds.filter(ad => ad.behavior === 'floating');

  // Auto-rotate carousel
  useEffect(() => {
    if (carouselAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % carouselAds.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselAds.length]);

  if (!sortedAds || sortedAds.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + carouselAds.length) % carouselAds.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % carouselAds.length);
  };

  // Get size classes
  const getSizeClasses = (size?: string) => {
    switch (size) {
      case 'large':
        return {
          container: 'p-2.5 md:p-3',
          image: 'w-16 h-16 md:w-20 md:h-20',
          title: 'text-sm md:text-base font-semibold',
          text: 'text-xs md:text-sm',
        };
      case 'medium':
        return {
          container: 'p-2 md:p-2.5',
          image: 'w-14 h-14 md:w-16 md:h-16',
          title: 'text-xs md:text-sm font-semibold',
          text: 'text-[10px] md:text-xs',
        };
      default: // small
        return {
          container: 'p-2',
          image: 'w-12 h-12',
          title: 'text-xs font-medium',
          text: 'text-[10px]',
        };
    }
  };

  const renderAd = (ad: Advertisement, index: number) => {
    const sizeClasses = getSizeClasses(ad.size);
    
    const content = (
      <div className={`flex items-center gap-3 ${sizeClasses.container}`}>
        {/* Image */}
        <div className={`${sizeClasses.image} flex-shrink-0 rounded-lg overflow-hidden bg-muted`}>
          <img
            src={ad.image}
            alt={ad.title || "Anúncio"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          {ad.title && (
            <p className={`${sizeClasses.title} text-foreground line-clamp-1`}>
              {ad.title}
            </p>
          )}
          {ad.text && (
            <p className={`${sizeClasses.text} text-muted-foreground line-clamp-2 mt-0.5`}>
              {ad.text}
            </p>
          )}
          {ad.link && (
            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-primary font-medium mt-1">
              Ver mais
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div
        key={ad.id}
        className="relative rounded-xl overflow-hidden bg-secondary/20 hover:bg-secondary/30 transition-colors"
      >
        {ad.link ? (
          <a 
            href={ad.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Carousel ads */}
      {carouselAds.length > 0 && (
        <div className="relative">
          {/* Show current ad */}
          {renderAd(carouselAds[currentIndex], currentIndex)}
          
          {/* Navigation for multiple ads */}
          {carouselAds.length > 1 && (
            <>
              {/* Arrow buttons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="h-6 w-6 bg-background/80 hover:bg-background rounded-full"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="h-6 w-6 bg-background/80 hover:bg-background rounded-full"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Dots indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {carouselAds.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1 rounded-full transition-all ${
                      idx === currentIndex ? "bg-primary w-3" : "bg-primary/30 w-1"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Fixed ads (always visible, no carousel) */}
      {fixedAds.map((ad, idx) => (
        <div key={ad.id}>
          {renderAd(ad, idx)}
        </div>
      ))}

      {/* Floating ads - positioned fixed on screen */}
      {floatingAds.map((ad) => (
        <div
          key={ad.id}
          className="fixed bottom-4 right-4 z-50 max-w-xs shadow-elevated rounded-xl animate-fade-in"
        >
          {renderAd(ad, 0)}
          <button
            onClick={(e) => {
              e.preventDefault();
              const el = e.currentTarget.parentElement;
              if (el) el.style.display = 'none';
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-background rounded-full shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}