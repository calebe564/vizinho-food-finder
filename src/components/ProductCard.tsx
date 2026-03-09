import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ImageIcon } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  images?: string[] | null;
  unit?: string | null;
  hasVariations?: boolean;
  variationCount?: number;
  minPrice?: number;
  maxPrice?: number;
  isPromotion?: boolean;
  promotionDescription?: string | null;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  images,
  unit,
  hasVariations,
  variationCount = 0,
  minPrice,
  maxPrice,
}: ProductCardProps) {
  const { isProductFavorite, toggleProductFavorite } = useFavorites();
  const { isAdmin } = useUserRole();
  const isFav = isProductFavorite(id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleProductFavorite(id);
    toast.success(newState ? "Adicionado aos favoritos!" : "Removido dos favoritos");
  };

  const formatPrice = (value: number, priceUnit?: string | null) => {
    const formatted = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    if (priceUnit && priceUnit !== "unidade") {
      return `${formatted} / ${priceUnit}`;
    }
    return formatted;
  };

  // Get display image
  const displayImage = images && images.length > 0 ? images[0] : image;

  return (
    <Link to={`/produto/${id}`} className="block">
      <Card className="overflow-hidden bg-card border-0 shadow-card hover:shadow-elevated transition-all duration-300 rounded-2xl cursor-pointer h-full">
        <div className="relative aspect-square">
          {displayImage ? (
            <img
              src={displayImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-primary-foreground" />
            </div>
          )}

          {/* Favorite button - hidden for admins */}
          {!isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background rounded-full"
              onClick={handleToggleFavorite}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          )}

          {/* Favorite indicator - hidden for admins */}
          {isFav && !isAdmin && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-red-500 text-white shadow-lg">
                <Heart className="h-3 w-3 mr-1 fill-white" />
                Favorito
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold line-clamp-2 mb-2">{name}</h3>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          <div className="mt-auto">
            {hasVariations && variationCount > 0 ? (
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs">
                  {variationCount} {variationCount === 1 ? "variação" : "variações"}
                </Badge>
                {/* Show price range without "A partir de" text */}
                {minPrice !== undefined && maxPrice !== undefined && minPrice !== maxPrice ? (
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(minPrice || price)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-lg font-bold text-primary">
                {formatPrice(price, unit)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
