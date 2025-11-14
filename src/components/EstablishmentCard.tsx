import { Link } from "react-router-dom";
import { MapPin, Phone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Product {
  name: string;
  price: number;
}

interface EstablishmentCardProps {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: number;
  phone: string;
  schedule: string;
  profileImage: string | null;
  isPaid: boolean;
  products: Product[];
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
}: EstablishmentCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
      <div className="relative">
        {profileImage ? (
          <img src={profileImage} alt={name} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-primary flex items-center justify-center">
            <span className="text-4xl font-bold text-primary-foreground">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {isPaid && (
          <Badge className="absolute top-3 right-3 bg-accent">Patrocinado</Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <Badge variant="secondary" className="mt-1 capitalize">
              {category}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{distance.toFixed(1)} km • {address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{schedule}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <a href={`tel:${phone}`} className="hover:text-primary">
              {phone}
            </a>
          </div>
        </div>

        {products.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Alguns produtos:</p>
            <div className="space-y-1">
              {products.slice(0, 3).map((product, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{product.name}</span>
                  <span className="font-medium">R$ {product.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to={`/estabelecimento/${id}`}>
          <Button className="w-full">Ver detalhes</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
