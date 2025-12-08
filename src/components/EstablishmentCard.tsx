import { Link } from "react-router-dom";
import { MapPin, Clock, MessageCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProximityColor, getProximityIcon } from "@/lib/proximityUtils";
import type { ProximityLevel } from "@/lib/proximityUtils";

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
  schedule?: string;
  profileImage?: string | null;
  isPaid?: boolean;
  products?: Product[];
  establishment?: Establishment;
  proximityLabel?: ProximityLevel;
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
  schedule,
  profileImage,
  isPaid,
  products,
  establishment,
  proximityLabel,
}: EstablishmentCardProps) {
  const actualId = establishment?.id || id || "";
  const actualName = establishment?.name || name || "";
  const actualCategory = establishment?.category || category || "";
  const actualAddress = establishment?.address || address || "";
  const actualPhone = establishment?.phone || phone || "";
  const actualSchedule = establishment?.schedule || schedule || "";
  const actualProfileImage = establishment?.profile_image || profileImage;
  const actualIsPaid = establishment?.is_paid ?? isPaid ?? false;
  const actualDistance = distance || 0;
  const actualProducts = products || [];

  const formatWhatsApp = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return `https://wa.me/55${cleaned}`;
  };

  return (
    <Card className="overflow-hidden bg-card border-0 shadow-card hover:shadow-elevated transition-all duration-300 rounded-2xl">
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

        {/* Distance Badge */}
        <div className="absolute bottom-3 right-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground shadow-lg">
            <MapPin className="h-3 w-3 mr-1" />
            {actualDistance.toFixed(1)} km
          </Badge>
        </div>
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
            {proximityLabel ? (
              <span className={getProximityColor(proximityLabel)}>
                {getProximityIcon(proximityLabel)} {proximityLabel}
              </span>
            ) : (
              <>
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{actualAddress}</span>
              </>
            )}
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

        <div className="flex gap-2">
          <Link to={`/estabelecimento/${actualId}`} className="flex-1">
            <Button className="w-full rounded-xl" size="sm">
              Ver detalhes
            </Button>
          </Link>
          <a 
            href={formatWhatsApp(actualPhone)} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="rounded-xl px-3">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
