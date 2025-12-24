import { Link } from 'react-router-dom';
import { Search, MapPin, Store, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProductSearchResultCard } from './ProductSearchResultCard';
import type { AISearchResults } from '@/hooks/useAISearch';

interface SearchResultsProps {
  results: AISearchResults | null;
  isLoading: boolean;
  searchTerm: string;
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
  outro: 'Outro',
};

export function SearchResults({ results, isLoading, searchTerm }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Buscando com IA...</p>
      </div>
    );
  }

  if (!results || !searchTerm) {
    return null;
  }

  const hasProducts = results.products.length > 0;
  const hasEstablishments = results.establishments.length > 0;
  const hasNoResults = !hasProducts && !hasEstablishments;

  return (
    <div className="space-y-6">
      {/* Corrected Query Feedback */}
      {results.correctedQuery && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Mostrando resultados para: </span>
            <strong className="text-primary">{results.correctedQuery}</strong>
          </p>
        </div>
      )}

      {/* No Results */}
      {hasNoResults && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum resultado encontrado</p>
          <p className="text-sm mt-1">Tente buscar com outras palavras</p>
        </div>
      )}

      {/* Products Section */}
      {hasProducts && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Produtos ({results.products.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {results.products.map((product) => (
              <ProductSearchResultCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Establishments Section */}
      {hasEstablishments && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Empresas ({results.establishments.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.establishments.map((establishment) => (
              <Link 
                key={establishment.id}
                to={`/estabelecimento/${establishment.id}`}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-all hover:border-primary/50"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={establishment.profileImage || undefined} 
                      alt={establishment.name} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {establishment.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {establishment.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {categoryLabels[establishment.category] || establishment.category}
                    </Badge>
                    
                    {(establishment.neighborhood || establishment.region) && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {[establishment.neighborhood, establishment.region, establishment.city]
                            .filter(Boolean)
                            .join(' – ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {establishment.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {establishment.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
