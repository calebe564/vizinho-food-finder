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
  const displayImage = bannerImage || profileImage;
  
  return (
    <Link to={`/estabelecimento/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border border-border/50 hover:border-primary/30 active:border-primary/50 shadow-sm hover:shadow-card transition-all duration-200 rounded-xl h-full">
        {/* Image area - aspect ratio prevents distortion */}
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
          
          {/* Fallback when no image */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${displayImage ? 'hidden' : 'flex'}`}
          >
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Store className="h-7 w-7 text-primary" />
            </div>
          </div>
          
          {/* Sponsored badge */}
          {isPaid && (
            <div className="absolute top-1.5 left-1.5">
              <Badge className="bg-accent text-accent-foreground text-[9px] px-1.5 py-0.5 shadow-md">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                Destaque
              </Badge>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="text-[13px] font-semibold text-white leading-tight line-clamp-2 drop-shadow-md">
              {name}
            </h3>
          </div>
        </div>

        {/* Content below image - larger touch target */}
        <div className="p-2.5 min-h-[52px]">
          {/* Category - larger text for readability */}
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
            {categoryLabels[category] || category}
          </p>
          
          {/* Proximity label */}
          {proximityLabel && (
            <div className="flex items-center gap-1 text-[11px] text-primary font-medium">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{proximityLabel}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}