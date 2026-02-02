import { Link } from "react-router-dom";
import { MapPin, Store, Package, Clock, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OpenClosedBadge, DeliveryBadge } from "@/components/StatusBadge";

interface ProductCardSearchProps {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  image?: string | null;
  establishmentId: string;
  establishmentName: string;
  establishmentCategory: string;
  establishmentImage?: string | null;
  establishmentNeighborhood?: string | null;
  establishmentCity?: string | null;
  establishmentSchedule?: string;
  establishmentPhone?: string;
  establishmentHasDelivery?: boolean;
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
  sorveteria: "Sorveteria",
  acai: "Açaí",
  espetinho: "Espetinho",
  outro: "Outro",
};

export function ProductCardSearch({
  id,
  name,
  price,
  description,
  image,
  establishmentId,
  establishmentName,
  establishmentCategory,
  establishmentImage,
  establishmentNeighborhood,
  establishmentCity,
  establishmentSchedule,
  establishmentPhone,
  establishmentHasDelivery,
}: ProductCardSearchProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const locationText = [establishmentNeighborhood, establishmentCity]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-border hover:border-primary/30 group">
      <div className="flex gap-3 p-3 md:p-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-8 h-8 md:w-10 md:h-10" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/produto/${id}`}>
            <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors md:text-lg">
              {name}
            </h3>
          </Link>

          {description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {description}
            </p>
          )}

          <div className="mt-1">
            <span className="text-base md:text-lg font-bold text-primary">
              {formatPrice(price)}
            </span>
          </div>
          
          {/* Status badges on product */}
          <div className="mt-2 flex flex-wrap gap-1">
            <OpenClosedBadge schedule={establishmentSchedule} size="sm" />
            <DeliveryBadge hasDelivery={establishmentHasDelivery} size="sm" />
          </div>
        </div>
      </div>

      {/* Establishment Info - clickable */}
      <Link
        to={`/estabelecimento/${establishmentId}`}
        className="block px-3 pb-3 md:px-4 md:pb-4"
      >
        <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
          <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
            <AvatarImage src={establishmentImage || undefined} alt={establishmentName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs md:text-sm">
              {establishmentName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium text-foreground truncate">
              {establishmentName}
            </p>
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
              <Badge variant="outline" className="text-[10px] md:text-xs px-1 py-0">
                {categoryLabels[establishmentCategory] || establishmentCategory}
              </Badge>
              {locationText && (
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                  {locationText}
                </span>
              )}
            </div>
            {establishmentPhone && (
              <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mt-0.5">
                <Phone className="w-2.5 h-2.5" />
                <span>{establishmentPhone}</span>
              </div>
            )}
          </div>

          <Store className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Link>
    </Card>
  );
}
