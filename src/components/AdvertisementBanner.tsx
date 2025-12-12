import { Link } from "react-router-dom";

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

  return (
    <div className="space-y-4">
      {advertisements.map((ad) => (
        <div
          key={ad.id}
          className="relative rounded-2xl overflow-hidden bg-secondary/30 hover:shadow-lg transition-shadow"
        >
          {ad.link ? (
            <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={ad.image}
                alt={ad.title || "Propaganda"}
                className="w-full h-32 md:h-40 object-cover"
              />
              {(ad.title || ad.text) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  {ad.title && (
                    <h3 className="text-lg font-bold text-foreground">{ad.title}</h3>
                  )}
                  {ad.text && (
                    <p className="text-sm text-muted-foreground">{ad.text}</p>
                  )}
                </div>
              )}
            </a>
          ) : (
            <>
              <img
                src={ad.image}
                alt={ad.title || "Propaganda"}
                className="w-full h-32 md:h-40 object-cover"
              />
              {(ad.title || ad.text) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  {ad.title && (
                    <h3 className="text-lg font-bold text-foreground">{ad.title}</h3>
                  )}
                  {ad.text && (
                    <p className="text-sm text-muted-foreground">{ad.text}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
