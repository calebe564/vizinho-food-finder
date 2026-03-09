import { Link } from "react-router-dom";
import { MapPin, Package, MessageCircle, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  if (neighborhood && city && uf) return `${neighborhood} · ${city}`;
  if (neighborhood && city) return `${neighborhood} · ${city}`;
  if (neighborhood) return neighborhood;
  return city || "";
}

function formatWhatsAppUrl(phone: string, productName: string, price: string, establishmentName: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const msg = encodeURIComponent(
    `Olá, vim do Comércio Vizinho e tenho interesse no produto: ${productName} - ${price}. Poderia me dar mais informações?`
  );
  return `https://wa.me/${number}?text=${msg}`;
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

  return (
    <Link to={`/produto/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
        {/* Image - square aspect ratio for compact look */}
        <div className="relative aspect-square bg-muted overflow-hidden">
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
            <Package className="h-8 w-8 md:h-10 md:w-10 text-primary/50" />
          </div>

          {/* Promotion badge - top left */}
          {isPromotion && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <Badge className="bg-red-600 text-white text-[9px] md:text-[10px] px-1.5 py-0.5 shadow-md animate-pulse">
                <Flame className="h-2.5 w-2.5 mr-0.5" />
                PROMOÇÃO
              </Badge>
            </div>
          )}
        </div>

        {/* Content - compact */}
        <div className="p-2 md:p-2.5">
          {/* Product name */}
          <h3 className="text-[11px] md:text-xs font-semibold line-clamp-2 text-foreground leading-tight mb-0.5">
            {name}
          </h3>

          {/* Price */}
          <p className="text-xs md:text-sm font-bold text-primary mb-0.5">
            {priceText}
          </p>

          {/* Promotion description */}
          {isPromotion && promotionDescription && (
            <p className="text-[8px] md:text-[9px] font-semibold text-red-600 dark:text-red-400 line-clamp-1 mb-0.5">
              🔥 {promotionDescription}
            </p>
          )}

          {/* Establishment name */}
          <p className="text-[9px] md:text-[10px] text-muted-foreground line-clamp-1 mb-0.5">
            {establishment?.name || "Empresa"}
          </p>

          {/* Location */}
          {locationText && (
            <div className="flex items-center gap-0.5 text-[8px] md:text-[9px] text-muted-foreground/80 mb-1.5">
              <MapPin className="h-2 w-2 flex-shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}

          {/* WhatsApp button - compact */}
          {hasWhatsapp && (
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-[9px] md:text-[10px] font-semibold py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              WhatsApp
            </button>
          )}
        </div>
      </Card>
    </Link>
  );
}
