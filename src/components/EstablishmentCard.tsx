import { Link } from "react-router-dom";
import { MapPin, Phone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
}

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
}: EstablishmentCardProps) {
  // Use establishment prop if provided
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
  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
      <div className="relative">
        {actualProfileImage ? (
          <img src={actualProfileImage} alt={actualName} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-primary flex items-center justify-center">
            <span className="text-4xl font-bold text-primary-foreground">
              {actualName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {actualIsPaid && (
          <Badge className="absolute top-3 right-3 bg-accent">Patrocinado</Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold">{actualName}</h3>
            <Badge variant="secondary" className="mt-1 capitalize">
              {actualCategory}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{actualDistance.toFixed(1)} km • {actualAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{actualSchedule}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <a href={`tel:${actualPhone}`} className="hover:text-primary">
              {actualPhone}
            </a>
          </div>
        </div>

        {actualProducts.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Alguns produtos:</p>
            <div className="space-y-1">
              {actualProducts.slice(0, 3).map((product, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{product.name}</span>
                  <span className="font-medium">R$ {product.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to={`/estabelecimento/${actualId}`}>
          <Button className="w-full">Ver detalhes</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
