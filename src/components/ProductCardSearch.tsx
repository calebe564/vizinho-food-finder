import { Link } from "react-router-dom";
import { MapPin, Store, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="flex gap-3 p-3">
        {/* Product Image */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/produto/${id}`}>
            <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {description}
            </p>
          )}

          <div className="mt-1">
            <span className="text-base font-bold text-primary">
              {formatPrice(price)}
            </span>
          </div>
        </div>
      </div>

      {/* Establishment Info - clickable */}
      <Link
        to={`/estabelecimento/${establishmentId}`}
        className="block px-3 pb-3"
      >
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={establishmentImage || undefined} alt={establishmentName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {establishmentName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {establishmentName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {categoryLabels[establishmentCategory] || establishmentCategory}
              </Badge>
              {locationText && (
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                  {locationText}
                </span>
              )}
            </div>
          </div>

          <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </Link>
    </Card>
  );
}
