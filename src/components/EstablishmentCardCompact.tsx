import { Link } from "react-router-dom";
import { MapPin, Star, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpenClosedBadge, DeliveryBadge } from "@/components/StatusBadge";
import { RatingBadge } from "@/components/StarRating";
import { categoryLabels } from "@/config/categories";

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

function formatLocation(neighborhood?: string | null, city?: string, state?: string | null): string {
  if (!neighborhood && !city) return "";
  const uf = state || "";
  const cityShort = city || "";
  if (neighborhood && cityShort && uf) return `${neighborhood} · ${cityShort}`;
  if (neighborhood && cityShort) return `${neighborhood} · ${cityShort}`;
  if (neighborhood) return neighborhood;
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
  const displayImage = mainPhotoUrl || bannerImage || profileImage;
  const locationText = formatLocation(neighborhood, city, state);
  
  return (
    <Link to={`/estabelecimento/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border-0 shadow-card hover:shadow-elevated transition-all duration-200 rounded-xl h-full">
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
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
          
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 ${displayImage ? 'hidden' : 'flex'}`}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <Store className="h-5 w-5 md:h-6 md:w-6 text-primary/60" />
            </div>
          </div>
          
          {/* Status badges - minimal overlay */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start gap-1">
            <div className="flex flex-wrap gap-1">
              <OpenClosedBadge schedule={schedule} size="sm" />
              <DeliveryBadge hasDelivery={hasDelivery} size="sm" />
            </div>
            
            {isPaid && (
              <Badge className="bg-accent text-accent-foreground text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 shadow-sm">
                <Star className="h-2 w-2 mr-0.5 fill-current" />
                Destaque
              </Badge>
            )}
          </div>
        </div>

        {/* Content - tight spacing like iFood */}
        <div className="p-2 md:p-2.5">
          <h3 className="text-xs md:text-sm font-semibold line-clamp-1 text-foreground leading-tight mb-0.5">
            {name}
          </h3>
          
          <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 mb-0.5">
            {categoryLabels[category] || category}
          </p>

          {(ratingCount ?? 0) > 0 && (
            <div className="mb-0.5">
              <RatingBadge average={ratingAverage ?? 0} count={ratingCount ?? 0} size="sm" />
            </div>
          )}
          
          {locationText && (
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
