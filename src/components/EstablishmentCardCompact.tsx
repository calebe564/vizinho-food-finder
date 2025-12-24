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
  isPaid,
}: EstablishmentCardCompactProps) {
  return (
    <Link to={`/estabelecimento/${id}`} className="block">
      <Card className="overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-card transition-all duration-200 rounded-xl h-full">
        {/* Logo area */}
        <div className="relative aspect-square bg-secondary/30 flex items-center justify-center p-3">
          <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
            <AvatarImage 
              src={profileImage || undefined} 
              alt={name} 
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Sponsored badge */}
          {isPaid && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 shadow-sm">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                Destaque
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 space-y-1.5">
          {/* Name - max 2 lines */}
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
          
          {/* Category */}
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {categoryLabels[category] || category}
          </p>
          
          {/* Proximity label */}
          {proximityLabel && (
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium pt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{proximityLabel}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
