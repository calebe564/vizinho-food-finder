import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserLocation } from "@/contexts/LocationContext";
import { calculateDistance } from "@/hooks/useGeolocation";
import { Heart, Store, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Establishment {
  id: string;
  name: string;
  category: string;
  address: string;
  neighborhood: string | null;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string | null;
  external_link: string | null;
  schedule: string;
  profile_image: string | null;
  is_paid: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  images: unknown;
  unit: string | null;
  establishment_id: string;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  product_id: string;
}

export default function Favorites() {
  const { favorites, productFavorites } = useFavorites();
  const { coordinates } = useUserLocation();

  const { data: establishments = [], isLoading: establishmentsLoading } = useQuery({
    queryKey: ["favorites-establishments", favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .in("id", favorites)
        .eq("active", true);

      if (error) throw error;
      return (data || []) as Establishment[];
    },
    enabled: favorites.length > 0,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["favorites-products", productFavorites],
    queryFn: async () => {
      if (productFavorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productFavorites);

      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: productFavorites.length > 0,
  });

  const { data: variations = [] } = useQuery({
    queryKey: ["favorites-products-variations", productFavorites],
    queryFn: async () => {
      if (productFavorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .in("product_id", productFavorites);

      if (error) throw error;
      return (data || []) as ProductVariation[];
    },
    enabled: productFavorites.length > 0,
  });

  const { data: establishmentProducts = [] } = useQuery({
    queryKey: ["products-favorites-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("establishment_id, name, price");
      if (error) throw error;
      return data || [];
    },
  });

  const getEstablishmentProducts = (establishmentId: string) => {
    return establishmentProducts.filter((p) => p.establishment_id === establishmentId);
  };

  const getProductVariations = (productId: string) => {
    return variations.filter((v) => v.product_id === productId);
  };

  const establishmentsWithDistance = establishments.map((est) => ({
    ...est,
    distance: coordinates
      ? calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          Number(est.latitude),
          Number(est.longitude)
        )
      : 0,
  }));

  const isLoading = establishmentsLoading || productsLoading;
  const hasEstablishments = favorites.length > 0;
  const hasProducts = productFavorites.length > 0;
  const hasFavorites = hasEstablishments || hasProducts;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold">Meus Favoritos</h1>
            </div>
            <p className="text-muted-foreground">
              Empresas e produtos que você salvou
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !hasFavorites ? (
            <div className="text-center py-20 bg-secondary/30 rounded-2xl animate-fade-in">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Nenhum favorito ainda</p>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Clique no ícone ❤️ em empresas ou produtos para favoritar
              </p>
              <Link to="/estabelecimentos">
                <Button className="rounded-xl">
                  <Store className="h-4 w-4 mr-2" />
                  Ver empresas
                </Button>
              </Link>
            </div>
          ) : (
            <Tabs defaultValue={hasEstablishments ? "establishments" : "products"} className="animate-fade-in">
              <TabsList className="mb-6">
                <TabsTrigger value="establishments" className="gap-2">
                  <Store className="h-4 w-4" />
                  Empresas ({favorites.length})
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  Produtos ({productFavorites.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="establishments">
                {establishmentsWithDistance.length === 0 ? (
                  <div className="text-center py-12 bg-secondary/30 rounded-2xl">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Nenhuma empresa favoritada
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Explore as empresas e favorite as suas preferidas
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {establishmentsWithDistance.map((establishment, index) => (
                      <div 
                        key={establishment.id}
                        className="animate-fade-in hover-lift"
                        style={{ animationDelay: `${0.05 * (index % 9)}s` }}
                      >
                        <EstablishmentCard
                          id={establishment.id}
                          name={establishment.name}
                          category={establishment.category}
                          address={establishment.address}
                          distance={establishment.distance}
                          phone={establishment.phone}
                          whatsapp={establishment.whatsapp}
                          externalLink={establishment.external_link}
                          schedule={establishment.schedule}
                          profileImage={establishment.profile_image}
                          isPaid={establishment.is_paid}
                          products={getEstablishmentProducts(establishment.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="products">
                {products.length === 0 ? (
                  <div className="text-center py-12 bg-secondary/30 rounded-2xl">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Nenhum produto favoritado
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Explore os produtos e favorite os seus preferidos
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product, index) => {
                      const productVariations = getProductVariations(product.id);
                      const hasVariations = productVariations.length > 0;
                      const prices = productVariations.map(v => v.price);
                      
                      return (
                        <div 
                          key={product.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${0.05 * (index % 12)}s` }}
                        >
                          <ProductCard
                            id={product.id}
                            name={product.name}
                            description={product.description}
                            price={product.price}
                            image={product.image}
                            images={product.images as string[] | null}
                            unit={product.unit}
                            hasVariations={hasVariations}
                            variationCount={productVariations.length}
                            minPrice={hasVariations ? Math.min(...prices) : undefined}
                            maxPrice={hasVariations ? Math.max(...prices) : undefined}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
