import { Link } from "react-router-dom";
import { MapPin, Store, Package, Clock, Phone, MessageCircle, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OpenClosedBadge, DeliveryBadge } from "@/components/StatusBadge";

interface ProductCardExtendedProps {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  image?: string | null;
  unit?: string | null;
  establishment: {
    id: string;
    name: string;
    neighborhood?: string | null;
    region?: string | null;
    city?: string | null;
    profileImage?: string | null;
    category: string;
    schedule?: string;
    phone?: string;
    whatsapp?: string;
    hasDelivery?: boolean;
    address?: string;
    googleMapsLink?: string | null;
  } | null;
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

export function ProductCardExtended({
  id,
  name,
  price,
  description,
  image,
  unit,
  establishment,
}: ProductCardExtendedProps) {
  const formatPrice = (value: number) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
    if (unit && unit !== "unidade") {
      return `${formatted}/${unit}`;
    }
    return formatted;
  };

  const locationText = establishment
    ? [establishment.neighborhood, establishment.city]
        .filter(Boolean)
        .join(" · ")
    : "";

  // Format phone number for WhatsApp link
  const getWhatsAppLink = () => {
    const phone = establishment?.whatsapp || establishment?.phone;
    if (!phone) return null;
    
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, "");
    // Add country code if not present
    const phoneWithCode = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    
    // Create message with product info
    const message = encodeURIComponent(
      `Olá! Vi o produto "${name}" por ${formatPrice(price)} no Comércio Vizinho e gostaria de mais informações.`
    );
    
    return `https://wa.me/${phoneWithCode}?text=${message}`;
  };

  const whatsappLink = getWhatsAppLink();

  // Get Google Maps link
  const getMapsLink = () => {
    if (establishment?.googleMapsLink) {
      return establishment.googleMapsLink;
    }
    // Fallback: search by address + city
    if (establishment?.address || establishment?.neighborhood) {
      const query = [establishment.address, establishment.neighborhood, establishment.city]
        .filter(Boolean)
        .join(", ");
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    return null;
  };

  const mapsLink = getMapsLink();

  // Format schedule for display
  const getScheduleDisplay = () => {
    if (!establishment?.schedule) return null;
    // Get first line of schedule for brief display
    const firstLine = establishment.schedule.split(",")[0].trim();
    return firstLine.length > 40 ? firstLine.substring(0, 40) + "..." : firstLine;
  };

  const scheduleDisplay = getScheduleDisplay();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-border hover:border-primary/30 group">
      {/* Product Header with Image */}
      <div className="flex gap-3 p-3 md:p-4">
        {/* Product Image */}
        <Link to={`/produto/${id}`} className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-muted">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                <Package className="w-10 h-10 md:w-12 md:h-12" />
              </div>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Link to={`/produto/${id}`}>
            <h3 className="font-bold text-foreground line-clamp-2 hover:text-primary transition-colors text-base md:text-lg">
              {name}
            </h3>
          </Link>

          {description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          )}

          <div className="mt-auto pt-2">
            <span className="text-lg md:text-xl font-bold text-primary">
              {formatPrice(price)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Badges Row */}
      <div className="px-3 pb-2 md:px-4 flex flex-wrap gap-2">
        <OpenClosedBadge schedule={establishment?.schedule} size="md" />
        <DeliveryBadge hasDelivery={establishment?.hasDelivery} size="md" />
      </div>

      {/* Establishment Info Section */}
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <div className="p-3 md:p-4 rounded-xl bg-secondary/50 space-y-3">
          {/* Establishment Header */}
          <Link
            to={`/estabelecimento/${establishment?.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
              <AvatarImage src={establishment?.profileImage || undefined} alt={establishment?.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm md:text-base font-semibold">
                {establishment?.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate text-sm md:text-base">
                {establishment?.name || "Empresa"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {categoryLabels[establishment?.category || ""] || establishment?.category || "Outro"}
                </Badge>
                {locationText && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{locationText}</span>
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Schedule & Phone Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground">
            {scheduleDisplay && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-primary" />
                <span className="truncate">{scheduleDisplay}</span>
              </div>
            )}
            {establishment?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                <span>{establishment.phone}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {whatsappLink ? (
              <Button
                asChild
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  WhatsApp
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled className="opacity-50">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Sem WhatsApp
              </Button>
            )}

            {mapsLink ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                  <Navigation className="w-4 h-4 mr-1.5" />
                  Ver no Maps
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled className="opacity-50">
                <Navigation className="w-4 h-4 mr-1.5" />
                Sem endereço
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
