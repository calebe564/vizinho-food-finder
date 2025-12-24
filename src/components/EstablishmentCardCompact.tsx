import { Link } from "react-router-dom";
import { MapPin, Star, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EstablishmentCardCompactProps {
  id: string;
  name: string;
  category: string;
  proximityLabel?: string;
  profileImage?: string | null;
  bannerImage?: string | null;
  isPaid?: boolean;
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
  outro: "Outro"
};

export function EstablishmentCardCompact({
  id,
  name,
  category,
  proximityLabel,
  profileImage,
  bannerImage,
  isPaid,
}: EstablishmentCardCompactProps) {
  // Use banner image if available, otherwise profile image
  const displayImage = bannerImage || profileImage;
  
  return (
    <Link to={`/estabelecimento/${id}`} className="block">
      <Card className="overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 rounded-xl h-full">
        {/* Image area - full card image, not just circle */}
        <div className="relative aspect-[4/3] bg-secondary/30 overflow-hidden">
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
          
          {/* Fallback when no image or image fails to load */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${displayImage ? 'hidden' : 'flex'}`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          {/* Sponsored badge */}
          {isPaid && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 shadow-md">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                Destaque
              </Badge>
            </div>
          )}
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Name overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 drop-shadow-md">
              {name}
            </h3>
          </div>
        </div>

        {/* Content below image */}
        <div className="p-2.5 space-y-1">
          {/* Category */}
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {categoryLabels[category] || category}
          </p>
          
          {/* Proximity label */}
          {proximityLabel && (
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{proximityLabel}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
