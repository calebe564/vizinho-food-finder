import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ImageIcon, Flame } from "lucide-react";
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
  isPromotion,
  promotionDescription,
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
      return `${formatted}/${priceUnit}`;
    }
    return formatted;
  };

  // Get display image
  const displayImage = images && images.length > 0 ? images[0] : image;

  return (
    <Link to={`/produto/${id}`} className="block">
      <Card className="overflow-hidden bg-card border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer">
        {/* Image container - compact aspect ratio */}
        <div className="relative aspect-square bg-muted">
          {displayImage ? (
            <img
              src={displayImage}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 md:h-10 md:w-10 text-primary/50" />
            </div>
          )}

          {/* Promotion badge - top left */}
          {isPromotion && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <Badge className="bg-red-600 text-white text-[9px] md:text-[10px] px-1.5 py-0.5 shadow-md animate-pulse">
                <Flame className="h-2.5 w-2.5 mr-0.5" />
                PROMOÇÃO
              </Badge>
            </div>
          )}

          {/* Favorite button - top right, hidden for admins */}
          {!isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1.5 right-1.5 h-7 w-7 bg-background/80 hover:bg-background rounded-full shadow-sm"
              onClick={handleToggleFavorite}
            >
              <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          )}

          {/* Favorite indicator - hidden for admins */}
          {isFav && !isAdmin && !isPromotion && (
            <div className="absolute top-1.5 left-1.5">
              <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 shadow-md">
                <Heart className="h-2.5 w-2.5 mr-0.5 fill-white" />
                Favorito
              </Badge>
            </div>
          )}
        </div>

        {/* Content - compact padding */}
        <CardContent className="p-2 md:p-2.5">
          {/* Product name */}
          <h3 className="text-xs md:text-sm font-semibold line-clamp-2 leading-tight mb-0.5">{name}</h3>

          {/* Promotion description */}
          {isPromotion && promotionDescription && (
            <p className="text-[9px] md:text-[10px] font-semibold text-red-600 dark:text-red-400 line-clamp-1 mb-0.5">
              🔥 {promotionDescription}
            </p>
          )}
          
          {/* Description - only show if no promotion description */}
          {description && !promotionDescription && (
            <p className="text-[9px] md:text-[10px] text-muted-foreground line-clamp-1 mb-0.5">
              {description}
            </p>
          )}

          {/* Price section */}
          <div className="mt-1">
            {hasVariations && variationCount > 0 ? (
              <div className="space-y-0.5">
                <Badge variant="secondary" className="text-[8px] md:text-[9px] px-1 py-0">
                  {variationCount} {variationCount === 1 ? "variação" : "variações"}
                </Badge>
                {minPrice !== undefined && maxPrice !== undefined && minPrice !== maxPrice ? (
                  <p className="text-xs md:text-sm font-bold text-primary">
                    {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm font-bold text-primary">
                    {formatPrice(minPrice || price)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm md:text-base font-bold text-primary">
                {formatPrice(price, unit)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
