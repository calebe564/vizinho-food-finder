import { Link } from "react-router-dom";
import { MapPin, Clock, MessageCircle, Star, MoreVertical, Heart, Share2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  is_paid: boolean;
  latitude: number;
  longitude: number;
}

interface EstablishmentCardProps {
  id?: string;
  name?: string;
  category?: string;
  address?: string;
  distance?: number;
  phone?: string;
  whatsapp?: string | null;
  externalLink?: string | null;
  schedule?: string;
  profileImage?: string | null;
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
  outro: "Outro"
};

export function EstablishmentCard({
  id,
  name,
  category,
  address,
  distance,
  phone,
  whatsapp,
  externalLink,
  schedule,
  profileImage,
  isPaid,
  products,
  establishment,
}: EstablishmentCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const actualId = establishment?.id || id || "";
  const actualName = establishment?.name || name || "";
  const actualCategory = establishment?.category || category || "";
  const actualAddress = establishment?.address || address || "";
  const actualWhatsapp = establishment?.whatsapp || whatsapp || null;
  const actualExternalLink = establishment?.external_link || externalLink || null;
  const actualSchedule = establishment?.schedule || schedule || "";
  const actualProfileImage = establishment?.profile_image || profileImage;
  const actualIsPaid = establishment?.is_paid ?? isPaid ?? false;
  const actualDistance = distance || 0;
  const actualProducts = products || [];

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
      // Fallback: mostrar opções
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
    <Link to={`/estabelecimento/${actualId}`} className="block">
      <Card className="overflow-hidden bg-card border-0 shadow-card hover:shadow-elevated transition-all duration-300 rounded-2xl cursor-pointer">
        <div className="relative">
          {actualProfileImage ? (
            <img 
              src={actualProfileImage} 
              alt={actualName} 
              className="w-full h-44 object-cover"
            />
          ) : (
            <div className="w-full h-44 bg-gradient-primary flex items-center justify-center">
              <span className="text-5xl font-bold text-primary-foreground">
                {actualName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {actualIsPaid && (
              <Badge className="bg-accent text-accent-foreground shadow-lg">
                <Star className="h-3 w-3 mr-1" />
                Patrocinado
              </Badge>
            )}
          </div>

          {/* Three dots menu */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-background/80 hover:bg-background rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={handleToggleFavorite} className="cursor-pointer">
                  <Heart className={`h-4 w-4 mr-2 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  {isFav ? "Remover dos favoritos" : "Favoritar empresa"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                  <Globe className="h-4 w-4 mr-2" />
                  Copiar link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Distance Badge */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground shadow-lg">
              <MapPin className="h-3 w-3 mr-1" />
              {actualDistance.toFixed(1)} km
            </Badge>
          </div>

          {/* Favorite indicator */}
          {isFav && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-red-500 text-white shadow-lg">
                <Heart className="h-3 w-3 mr-1 fill-white" />
                Favorito
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="mb-3">
            <h3 className="text-lg font-bold line-clamp-1">{actualName}</h3>
            <Badge variant="secondary" className="mt-2 text-xs font-medium">
              {categoryLabels[actualCategory] || actualCategory}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{actualAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{actualSchedule}</span>
            </div>
          </div>

          {actualProducts.length > 0 && (
            <div className="mb-4 p-3 bg-secondary/50 rounded-xl">
              <p className="text-xs font-medium text-muted-foreground mb-2">Produtos em destaque</p>
              <div className="space-y-1.5">
                {actualProducts.slice(0, 2).map((product, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-foreground line-clamp-1">{product.name}</span>
                    <span className="font-semibold text-primary">R$ {product.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {hasWhatsapp && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 rounded-xl gap-2"
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
                className="flex-1 rounded-xl gap-2"
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
