import { Link } from "react-router-dom";
import { MapPin, Store, Package, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

// Map of known cities to their states
const cityStateMap: Record<string, string> = {
  "são paulo": "SP",
  "belo horizonte": "MG",
  "rio de janeiro": "RJ",
  "brasília": "DF",
  "curitiba": "PR",
  "porto alegre": "RS",
  "salvador": "BA",
  "fortaleza": "CE",
  "recife": "PE",
  "manaus": "AM",
  "goiânia": "GO",
  "campinas": "SP",
  "guarulhos": "SP",
  "contagem": "MG",
  "betim": "MG",
  "ribeirão das neves": "MG",
  "uberlândia": "MG",
  "juiz de fora": "MG",
  "nova lima": "MG",
  "santa luzia": "MG",
  "ibirité": "MG",
  "sete lagoas": "MG",
};

function getStateAbbreviation(city?: string): string {
  if (!city) return "";
  const cityLower = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [cityName, state] of Object.entries(cityStateMap)) {
    const normalizedCityName = cityName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cityLower.includes(normalizedCityName)) {
      return state;
    }
  }
  
  return "MG";
}

function formatLocation(neighborhood?: string | null, city?: string): string {
  if (!neighborhood && !city) return "";
  
  const state = getStateAbbreviation(city);
  const cityShort = city || "";
  
  if (neighborhood && cityShort) {
    return `${neighborhood} · ${cityShort} – ${state}`;
  }
  
  if (neighborhood) {
    return neighborhood;
  }
  
  return cityShort ? `${cityShort} – ${state}` : "";
}

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
    ? formatLocation(establishment.neighborhood, establishment.city)
    : "";

  return (
    <Link to={`/produto/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border border-border hover:border-accent/30 shadow-card hover:shadow-elevated transition-all duration-200 rounded-lg md:rounded-xl h-full flex flex-col">
        {/* Image area - SMALLER to match establishment cards */}
        <div className="relative aspect-[3/2] bg-muted overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback when no image */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${image ? 'hidden' : 'flex'}`}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </div>
          
          {/* Badges - Top row */}
          <div className="absolute top-1 left-1 right-1 md:top-2 md:left-2 md:right-2 flex justify-between items-start gap-1">
            {/* Status badges - left */}
            <div className="flex flex-wrap gap-0.5 md:gap-1">
              <OpenClosedBadge schedule={establishment?.schedule} size="sm" />
              <DeliveryBadge hasDelivery={establishment?.hasDelivery} size="sm" />
            </div>
          </div>
        </div>

        {/* Content - compact */}
        <div className="p-2 md:p-2.5 flex flex-col flex-1">
          {/* Product Name */}
          <h3 className="text-[11px] md:text-xs font-bold line-clamp-2 text-foreground leading-tight mb-0.5">
            {name}
          </h3>
          
          {/* Price */}
          <p className="text-[11px] md:text-xs font-bold text-primary mb-0.5">
            {formatPrice(price)}
          </p>
          
          {/* Description - compact */}
          {description && (
            <p className="text-[9px] md:text-[10px] text-muted-foreground line-clamp-1 mb-0.5">
              {description}
            </p>
          )}
          
          {/* Establishment Name */}
          <p className="text-[9px] md:text-[10px] font-medium text-muted-foreground line-clamp-1">
            {establishment?.name || "Empresa"}
          </p>
          
          {/* Location */}
          {locationText && (
            <div className="flex items-center gap-0.5 text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
              <MapPin className="h-2 w-2 flex-shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
