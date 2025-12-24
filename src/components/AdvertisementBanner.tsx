import { ExternalLink } from "lucide-react";

interface Advertisement {
  id: string;
  image: string;
  title: string | null;
  text: string | null;
  link: string | null;
}

interface AdvertisementBannerProps {
  advertisements: Advertisement[];
}

export function AdvertisementBanner({ advertisements }: AdvertisementBannerProps) {
  if (!advertisements || advertisements.length === 0) {
    return null;
  }

  // Show only first ad on mobile for cleaner experience
  const displayAds = advertisements.slice(0, 1);

  return (
    <div className="space-y-2">
      {displayAds.map((ad) => (
        <div
          key={ad.id}
          className="relative rounded-xl overflow-hidden bg-secondary/20"
        >
          {ad.link ? (
            <a 
              href={ad.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 p-2.5 hover:bg-secondary/30 transition-colors"
            >
              {/* Compact image */}
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                <img
                  src={ad.image}
                  alt={ad.title || "Anúncio"}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                {ad.title && (
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {ad.title}
                  </p>
                )}
                {ad.text && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {ad.text}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
                  Ver mais
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 p-2.5">
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                <img
                  src={ad.image}
                  alt={ad.title || "Anúncio"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                {ad.title && (
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {ad.title}
                  </p>
                )}
                {ad.text && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {ad.text}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
