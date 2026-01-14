import { Link } from "react-router-dom";
import { MapPin, Star, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EstablishmentCardCompactProps {
  id: string;
  name: string;
  category: string;
  proximityLabel?: string;
  profileImage?: string | null;
  bannerImage?: string | null;
  isPaid?: boolean;
  neighborhood?: string | null;
  city?: string;
  minPrice?: number | null;
  productNames?: string[];
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

// Mapping categories to typical products
const categoryProducts: Record<string, string[]> = {
  restaurante: ["Almoço", "Jantar"],
  lanchonete: ["Lanches", "Salgados"],
  padaria: ["Pães", "Bolos"],
  supermercado: ["Alimentos", "Bebidas"],
  açougue: ["Carnes", "Frios"],
  hortifruti: ["Frutas", "Verduras"],
  pizzaria: ["Pizzas", "Massas"],
  hamburgueria: ["Hambúrgueres", "Lanches"],
  bar: ["Bebidas", "Petiscos"],
  cafe: ["Cafés", "Doces"],
  sorveteria: ["Sorvetes", "Açaí"],
  acai: ["Açaí", "Sorvetes"],
  espetinho: ["Espetinhos", "Churrascos"],
  outro: ["Produtos", "Serviços"],
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
  
  // Default to MG if no match (based on current context)
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

export function EstablishmentCardCompact({
  id,
  name,
  category,
  proximityLabel,
  profileImage,
  bannerImage,
  isPaid,
  neighborhood,
  city,
  minPrice,
  productNames,
}: EstablishmentCardCompactProps) {
  const displayImage = bannerImage || profileImage;
  
  // Get products to display - use actual product names or category defaults
  const displayProducts = productNames && productNames.length > 0 
    ? productNames.slice(0, 2) 
    : categoryProducts[category] || [categoryLabels[category] || category];
  
  // Format location as "Bairro · Cidade – UF"
  const locationText = formatLocation(neighborhood, city);
  
  return (
    <Link to={`/estabelecimento/${id}`} className="block active:scale-[0.98] transition-transform">
      <Card className="overflow-hidden bg-card border border-border hover:border-accent/30 shadow-card hover:shadow-elevated transition-all duration-200 rounded-xl h-full">
        {/* Image area - more compact */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={name}
              className="w-full h-full object-cover"
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
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${displayImage ? 'hidden' : 'flex'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          {/* Sponsored badge - top right */}
          {isPaid && (
            <div className="absolute top-1.5 right-1.5">
              <Badge className="bg-accent text-accent-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                <Star className="h-2 w-2 mr-0.5 fill-current" />
                Destaque
              </Badge>
            </div>
          )}
        </div>

        {/* Content - more compact */}
        <div className="p-2.5">
          {/* Name - up to 2 lines */}
          <h3 className="text-xs font-bold line-clamp-2 text-foreground leading-tight mb-1">
            {name}
          </h3>
          
          {/* Category/Products */}
          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
            {displayProducts.join(" • ")}
          </p>
          
          {/* Price range */}
          {minPrice !== null && minPrice !== undefined && (
            <p className="text-[10px] font-medium text-primary mb-1">
              A partir de R$ {minPrice.toFixed(2).replace(".", ",")}
            </p>
          )}
          
          {/* Location */}
          {locationText && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
