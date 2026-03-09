import { Link } from "react-router-dom";
import { MapPin, Star, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpenClosedBadge, DeliveryBadge } from "@/components/StatusBadge";
import { RatingBadge } from "@/components/StarRating";

interface EstablishmentCardCompactProps {
  id: string;
  name: string;
  category: string;
  proximityLabel?: string;
  profileImage?: string | null;
  bannerImage?: string | null;
  mainPhotoUrl?: string | null;
  isPaid?: boolean;
  neighborhood?: string | null;
  city?: string;
  state?: string | null;
  schedule?: string;
  hasDelivery?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
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


function formatLocation(neighborhood?: string | null, city?: string, state?: string | null): string {
  if (!neighborhood && !city) return "";
  
  const uf = state || "";
  const cityShort = city || "";
  
  if (neighborhood && cityShort && uf) {
    return `${neighborhood} · ${cityShort} – ${uf}`;
  }
  if (neighborhood && cityShort) {
    return `${neighborhood} · ${cityShort}`;
  }
  if (neighborhood) {
    return neighborhood;
  }
  return uf ? `${cityShort} – ${uf}` : cityShort;
}

export function EstablishmentCardCompact({
  id,
  name,
  category,
  proximityLabel,
  profileImage,
  bannerImage,
  mainPhotoUrl,
  isPaid,
  neighborhood,
  city,
  state,
  schedule,
  hasDelivery,
  ratingAverage,
  ratingCount,
}: EstablishmentCardCompactProps) {
  // Priority: mainPhotoUrl (from establishment_photos) > bannerImage > profileImage
  const displayImage = mainPhotoUrl || bannerImage || profileImage;
  
  // Format location as "Bairro · Cidade – UF"
  const locationText = formatLocation(neighborhood, city, state);
  
  return (
    <Link to={`/estabelecimento/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border border-border hover:border-accent/30 shadow-card hover:shadow-elevated transition-all duration-200 rounded-xl md:rounded-2xl h-full">
        {/* Image area - compact on mobile, larger on desktop */}
        <div className="relative aspect-[4/3] md:aspect-[3/2] lg:aspect-[4/3] bg-muted overflow-hidden">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback when no image */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${displayImage ? 'hidden' : 'flex'}`}
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/20 flex items-center justify-center">
              <Store className="h-5 w-5 md:h-7 md:w-7 text-primary" />
            </div>
          </div>
          
          {/* Badges - Top row */}
          <div className="absolute top-1.5 left-1.5 right-1.5 md:top-2.5 md:left-2.5 md:right-2.5 flex justify-between items-start gap-1">
            {/* Status badges - left */}
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              <OpenClosedBadge schedule={schedule} size="sm" />
              <DeliveryBadge hasDelivery={hasDelivery} size="sm" />
            </div>
            
            {/* Sponsored badge - right */}
            {isPaid && (
              <Badge className="bg-accent text-accent-foreground text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0">
                <Star className="h-2 w-2 md:h-2.5 md:w-2.5 mr-0.5 fill-current" />
                Destaque
              </Badge>
            )}
          </div>
        </div>

        {/* Content - compact on mobile, more spacious on desktop */}
        <div className="p-2.5 md:p-3.5 lg:p-4">
          {/* Name - up to 2 lines */}
          <h3 className="text-xs font-bold line-clamp-2 text-foreground leading-tight mb-1 md:text-sm lg:text-base md:mb-1.5">
            {name}
          </h3>
          
          {/* Category */}
          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1 md:text-xs lg:text-sm md:mb-1.5">
            {categoryLabels[category] || category}
          </p>
          
          {/* Location */}
          {locationText && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground md:text-xs lg:text-sm">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
