import { Link } from 'react-router-dom';
import { MapPin, Store, Phone, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadges } from '@/components/StatusBadge';
import type { ProductSearchResult } from '@/hooks/useAISearch';

interface ProductSearchResultCardProps {
  product: ProductSearchResult;
}

const categoryLabels: Record<string, string> = {
  restaurante: 'Restaurante',
  lanchonete: 'Lanchonete',
  padaria: 'Padaria',
  supermercado: 'Supermercado',
  açougue: 'Açougue',
  hortifruti: 'Hortifruti',
  pizzaria: 'Pizzaria',
  hamburgueria: 'Hamburgueria',
  bar: 'Bar',
  cafe: 'Café',
  sorveteria: 'Sorveteria',
  acai: 'Açaí',
  espetinho: 'Espetinho',
  outro: 'Outro',
};

export function ProductSearchResultCard({ product }: ProductSearchResultCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const locationText = [
    product.establishment?.neighborhood,
    product.establishment?.region,
    product.establishment?.city
  ].filter(Boolean).join(' – ');

  return (
    <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-5 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-muted">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Store className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg md:text-xl truncate">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm md:text-base text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          )}

          <div className="mt-2">
            <span className="text-lg md:text-xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.unit && product.unit !== 'unidade' && (
              <span className="text-sm md:text-base text-muted-foreground ml-1">
                / {product.unit}
              </span>
            )}
          </div>
          
          {/* Status badges */}
          {product.establishment && (
            <div className="mt-2">
              <StatusBadges 
                schedule={product.establishment.schedule} 
                hasDelivery={product.establishment.hasDelivery}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Establishment Info */}
      {product.establishment && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 md:h-12 md:w-12">
                <AvatarImage 
                  src={product.establishment.profileImage || undefined} 
                  alt={product.establishment.name} 
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {product.establishment.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <p className="font-medium text-foreground text-sm md:text-base">
                  Vendido por: {product.establishment.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    {categoryLabels[product.establishment.category] || product.establishment.category}
                  </Badge>
                  {locationText && (
                    <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[150px] md:max-w-[200px]">{locationText}</span>
                    </div>
                  )}
                </div>
                {product.establishment.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Phone className="w-3 h-3" />
                    <span>{product.establishment.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <Link to={`/estabelecimento/${product.establishment.id}`}>
              <Button variant="outline" size="sm" className="md:size-default">
                Ver empresa
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
