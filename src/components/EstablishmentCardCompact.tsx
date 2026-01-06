import { Link } from "react-router-dom";
import { MapPin, Star, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  outro: "Outro",
  sorveteria: "Sorveteria",
  acai: "Açaí",
  espetinho: "Espetinho",
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
      <Card className="overflow-hidden bg-card border border-border hover:border-accent/30 shadow-card hover:shadow-elevated transition-all duration-200 rounded-2xl h-full">
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
          
          {/* Fallback when no image */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${displayImage ? 'hidden' : 'flex'}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Store className="h-7 w-7 text-primary" />
            </div>
          </div>
          
          {/* Logo overlay - bottom left of image */}
          <div className="absolute -bottom-5 left-3">
            <div className="h-12 w-12 rounded-full border-2 border-card shadow-md bg-card overflow-hidden flex items-center justify-center">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={name}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center ${profileImage ? 'hidden' : ''}`}>
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 pt-7">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h3 className="text-sm font-bold line-clamp-1 text-foreground">
                {name}
              </h3>
              
              {/* Category */}
              <p className="text-xs text-muted-foreground line-clamp-1">
                {categoryLabels[category] || category}
              </p>
              
              {/* Proximity label */}
              {proximityLabel && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{proximityLabel}</span>
                </div>
              )}
            </div>
            
            {/* Sponsored badge - right side */}
            {isPaid && (
              <Badge className="flex-shrink-0 bg-accent text-accent-foreground text-[10px] px-2 py-0.5 rounded-full">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                Destaque
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
