import { Link } from "react-router-dom";
import { MapPin, Package, MessageCircle, Navigation, Phone, Clock, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OpenClosedBadge, DeliveryBadge } from "@/components/StatusBadge";

import { Badge } from "@/components/ui/badge";

interface ProductCardExtendedProps {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  image?: string | null;
  unit?: string | null;
  isPromotion?: boolean;
  promotionDescription?: string | null;
  establishment: {
    id: string;
    name: string;
    neighborhood?: string | null;
    region?: string | null;
    city?: string | null;
    state?: string | null;
    profileImage?: string | null;
    category: string;
    schedule?: string;
    phone?: string;
    whatsapp?: string | null;
    hasDelivery?: boolean;
    address?: string;
    googleMapsLink?: string | null;
  } | null;
}

function formatLocation(neighborhood?: string | null, city?: string | null, state?: string | null): string {
  if (!neighborhood && !city) return "";
  const uf = state || "";
  if (neighborhood && city && uf) return `${neighborhood} · ${city} – ${uf}`;
  if (neighborhood && city) return `${neighborhood} · ${city}`;
  if (neighborhood) return neighborhood;
  return uf ? `${city} – ${uf}` : (city || "");
}

function formatWhatsAppUrl(phone: string, productName: string, price: string, establishmentName: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const msg = encodeURIComponent(
    `Olá, vim do Comércio Vizinho e tenho interesse no produto: ${productName} - ${price}. Poderia me dar mais informações?`
  );
  return `https://wa.me/${number}?text=${msg}`;
}

function getMapsUrl(est: ProductCardExtendedProps["establishment"]): string | null {
  if (!est) return null;
  if (est.googleMapsLink) return est.googleMapsLink;
  if (est.address || est.neighborhood) {
    const query = [est.address, est.neighborhood, est.city].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return null;
}

export function ProductCardExtended({
  id,
  name,
  price,
  description,
  image,
  unit,
  isPromotion,
  promotionDescription,
  establishment,
}: ProductCardExtendedProps) {
  const formatPrice = (value: number) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
    if (unit && unit !== "unidade") return `${formatted}/${unit}`;
    return formatted;
  };

  const priceText = formatPrice(price);
  const locationText = establishment ? formatLocation(establishment.neighborhood, establishment.city, establishment.state) : "";
  const hasWhatsapp = !!(establishment?.whatsapp && establishment.whatsapp.trim());
  const hasPhone = !!(establishment?.phone && establishment.phone.trim());
  const mapsLink = getMapsUrl(establishment);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasWhatsapp) {
      window.open(
        formatWhatsAppUrl(establishment!.whatsapp!, name, priceText, establishment!.name),
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mapsLink) window.open(mapsLink, "_blank", "noopener,noreferrer");
  };

  return (
    <Link to={`/produto/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border border-border hover:border-accent/30 shadow-card hover:shadow-elevated transition-all duration-200 rounded-xl md:rounded-2xl h-full flex flex-col">
        {/* Image — same aspect ratio as establishment cards */}
        <div className="relative aspect-[4/3] md:aspect-[3/2] lg:aspect-[4/3] bg-muted overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fb = e.currentTarget.nextElementSibling;
                if (fb) (fb as HTMLElement).style.display = "flex";
              }}
            />
          ) : null}

          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${image ? "hidden" : "flex"}`}
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/20 flex items-center justify-center">
              <Package className="h-5 w-5 md:h-7 md:w-7 text-primary" />
            </div>
          </div>

          {/* Status badges — top row */}
          <div className="absolute top-1.5 left-1.5 right-1.5 md:top-2.5 md:left-2.5 md:right-2.5 flex justify-between items-start gap-1">
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {isPromotion && (
                <Badge className="bg-red-600 text-white text-[9px] md:text-[10px] px-1.5 py-0.5 animate-pulse">
                  <Flame className="h-2.5 w-2.5 mr-0.5" />
                  PROMOÇÃO
                </Badge>
              )}
              <OpenClosedBadge schedule={establishment?.schedule} size="sm" />
              <DeliveryBadge hasDelivery={establishment?.hasDelivery} size="sm" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-2.5 md:p-3.5 lg:p-4 flex flex-col flex-1">
          {/* Product name */}
          <h3 className="text-xs font-bold line-clamp-2 text-foreground leading-tight mb-0.5 md:text-sm lg:text-base md:mb-1">
            {name}
          </h3>

          {/* Price */}
          <p className="text-xs font-bold text-primary mb-0.5 md:text-sm md:mb-1">
            {priceText}
          </p>

          {/* Promotion description */}
          {isPromotion && promotionDescription && (
            <p className="text-[9px] md:text-[10px] font-semibold text-red-600 dark:text-red-400 mb-0.5">
              🔥 {promotionDescription}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="text-[9px] md:text-[10px] text-muted-foreground line-clamp-1 mb-0.5">
              {description}
            </p>
          )}

          {/* Establishment name */}
          <p className="text-[10px] md:text-xs font-medium text-muted-foreground line-clamp-1 mb-0.5">
            {establishment?.name || "Empresa"}
          </p>

          {/* Location */}
          {locationText && (
            <div className="flex items-center gap-0.5 text-[9px] md:text-[10px] text-muted-foreground mb-1">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}

          {/* Phone */}
          {hasPhone && (
            <div className="flex items-center gap-0.5 text-[9px] md:text-[10px] text-muted-foreground mb-1">
              <Phone className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="line-clamp-1">{establishment!.phone}</span>
            </div>
          )}

          {/* Spacer to push action buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex gap-1.5 mt-1.5">
            {hasWhatsapp && (
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-[9px] md:text-[10px] font-semibold py-1.5 md:py-2 rounded-lg transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </button>
            )}
            {mapsLink && (
              <button
                onClick={handleMaps}
                className="flex-1 flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] md:text-[10px] font-semibold py-1.5 md:py-2 rounded-lg transition-colors"
              >
                <Navigation className="h-3 w-3" />
                Maps
              </button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}