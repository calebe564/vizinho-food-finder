import { Link } from "react-router-dom";
import { MapPin, Clock, MessageCircle, Star, MoreVertical, Heart, Share2, Globe, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFavorites } from "@/hooks/useFavorites";
import { shareContent, shareViaWhatsApp, copyToClipboard } from "@/lib/shareUtils";
import { toast } from "sonner";

interface Product {
  name: string;
  price: number;
}

interface Establishment {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  whatsapp?: string | null;
  external_link?: string | null;
  schedule: string;
  profile_image: string | null;
  banner_image?: string | null;
  images?: unknown;
  is_paid: boolean;
  latitude: number;
  longitude: number;
}

interface EstablishmentCardProps {
  id?: string;
  name?: string;
  category?: string;
  address?: string;
  proximityLabel?: string;
  distance?: number;
  phone?: string;
  whatsapp?: string | null;
  externalLink?: string | null;
  schedule?: string;
  profileImage?: string | null;
  bannerImage?: string | null;
  images?: string[] | null;
  isPaid?: boolean;
  products?: Product[];
  establishment?: Establishment;
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

export function EstablishmentCard({
  id,
  name,
  category,
  address,
  proximityLabel,
  distance,
  phone,
  whatsapp,
  externalLink,
  schedule,
  profileImage,
  bannerImage,
  images,
  isPaid,
  products,
  establishment,
}: EstablishmentCardProps) {
  const displayLabel = proximityLabel || (distance !== undefined ? `${distance.toFixed(1)} km de você` : undefined);
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const actualId = establishment?.id || id || "";
  const actualName = establishment?.name || name || "";
  const actualCategory = establishment?.category || category || "";
  const actualAddress = establishment?.address || address || "";
  const actualWhatsapp = establishment?.whatsapp || whatsapp || null;
  const actualExternalLink = establishment?.external_link || externalLink || null;
  const actualSchedule = establishment?.schedule || schedule || "";
  const actualProfileImage = establishment?.profile_image || profileImage;
  const actualBannerImage = establishment?.banner_image || bannerImage;
  const actualIsPaid = establishment?.is_paid ?? isPaid ?? false;
  const actualProducts = products || [];
  
  const getCoverImage = () => {
    const estImages = establishment?.images;
    if (estImages && Array.isArray(estImages) && estImages.length > 0) {
      return estImages[0] as string;
    }
    if (images && images.length > 0) {
      return images[0];
    }
    if (actualBannerImage) return actualBannerImage;
    if (actualProfileImage) return actualProfileImage;
    return null;
  };
  
  const coverImage = getCoverImage();
  const isFav = isFavorite(actualId);

  const formatWhatsApp = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    return `https://wa.me/${number}`;
  };

  const hasWhatsapp = actualWhatsapp && actualWhatsapp.trim() !== "";

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasWhatsapp) {
      window.open(formatWhatsApp(actualWhatsapp!), "_blank", "noopener,noreferrer");
    }
  };

  const handleSiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (actualExternalLink) {
      window.open(actualExternalLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleFavorite(actualId);
    toast.success(newState ? "Adicionado aos favoritos!" : "Removido dos favoritos");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/estabelecimento/${actualId}`;
    const text = `Conheça ${actualName} no Comércio Vizinho!`;
    
    const shared = await shareContent({ title: actualName, text, url });
    
    if (!shared) {
      shareViaWhatsApp(text, url);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/estabelecimento/${actualId}`;
    copyToClipboard(url);
  };

  return (
    <Link to={`/estabelecimento/${actualId}`} className="block group">
      <Card className="overflow-hidden bg-card border border-border hover:border-accent/30 shadow-card hover:shadow-elevated transition-all duration-300 rounded-2xl">
        {/* Image */}
        <div className="relative">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={actualName} 
              className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-44 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Store className="h-16 w-16 text-primary/40" />
            </div>
          )}
          
          {/* Logo - bottom left overlapping */}
          <div className="absolute -bottom-6 left-4">
            <Avatar className="h-14 w-14 border-3 border-card shadow-elevated">
              <AvatarImage src={actualProfileImage || undefined} alt={actualName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {actualName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Actions menu */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-card/90 hover:bg-card rounded-full shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover shadow-elevated rounded-xl">
                <DropdownMenuItem onClick={handleToggleFavorite} className="cursor-pointer gap-2">
                  <Heart className={`h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                  {isFav ? "Remover dos favoritos" : "Favoritar"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
                  <Globe className="h-4 w-4" />
                  Copiar link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Favorite indicator */}
          {isFav && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-destructive text-destructive-foreground shadow-md rounded-full">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Favorito
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="pt-8 pb-4 px-4">
          {/* Header with name, category and badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold line-clamp-1 text-foreground">{actualName}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {categoryLabels[actualCategory] || actualCategory}
              </p>
            </div>
          </div>

          {/* Distance */}
          {displayLabel && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{displayLabel}</span>
            </div>
          )}

          {/* Sponsored badge */}
          {actualIsPaid && (
            <Badge className="bg-accent text-accent-foreground shadow-sm rounded-full mb-3">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Destaque
            </Badge>
          )}

          {/* Products */}
          {actualProducts.length > 0 && (
            <div className="mb-4 p-3 bg-secondary rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Produtos em destaque</p>
              <div className="space-y-1.5">
                {actualProducts.slice(0, 2).map((product, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-foreground line-clamp-1">{product.name}</span>
                    <span className="font-semibold text-accent">R$ {product.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            {hasWhatsapp && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 rounded-xl gap-2 h-10 shadow-button bg-accent hover:bg-accent/90"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            )}
            {actualExternalLink && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-xl gap-2 h-10 border-border"
                onClick={handleSiteClick}
              >
                <Globe className="h-4 w-4" />
                Site
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
