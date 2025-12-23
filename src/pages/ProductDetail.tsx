import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { ArrowLeft, Heart, Store, ImageIcon, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  images: string[] | null;
  unit: string | null;
  establishment_id: string;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  product_id: string;
}

interface Establishment {
  id: string;
  name: string;
  profile_image: string | null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { isProductFavorite, toggleProductFavorite } = useFavorites();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });

  const { data: variations = [] } = useQuery({
    queryKey: ["product-variations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", id)
        .order("price", { ascending: true });

      if (error) throw error;
      return (data || []) as ProductVariation[];
    },
    enabled: !!id,
  });

  const { data: establishment } = useQuery({
    queryKey: ["establishment-for-product", product?.establishment_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("id, name, profile_image")
        .eq("id", product!.establishment_id)
        .maybeSingle();

      if (error) throw error;
      return data as Establishment | null;
    },
    enabled: !!product?.establishment_id,
  });

  const isFav = product ? isProductFavorite(product.id) : false;

  const handleToggleFavorite = () => {
    if (!product) return;
    const newState = toggleProductFavorite(product.id);
    toast.success(newState ? "Produto adicionado aos favoritos!" : "Produto removido dos favoritos");
  };

  // Get all images for the product
  const getAllImages = (): string[] => {
    if (!product) return [];
    const imgs: string[] = [];
    
    // Check images array (new format)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      imgs.push(...product.images);
    }
    // Fallback to single image if no images array
    else if (product.image) {
      imgs.push(product.image);
    }
    
    return imgs;
  };

  const images = getAllImages();
  const hasVariations = variations.length > 0;

  const formatPrice = (price: number, unit?: string | null) => {
    const formatted = price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    if (unit && unit !== "unidade") {
      return `${formatted} / ${unit}`;
    }
    return formatted;
  };

  if (productLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Produto não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              Este produto pode ter sido removido ou não existe.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{product.name} | Comércio Vizinho</title>
        <meta name="description" content={product.description || `Confira ${product.name} no Comércio Vizinho`} />
      </Helmet>
      
      <Header />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          {establishment && (
            <Link 
              to={`/estabelecimento/${establishment.id}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para {establishment.name}
            </Link>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images Section */}
            <div className="space-y-4">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
                    <img
                      src={images[selectedImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Favorite button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 bg-background/80 hover:bg-background rounded-full"
                      onClick={handleToggleFavorite}
                    >
                      <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedImageIndex === index
                              ? "border-primary"
                              : "border-transparent hover:border-muted-foreground/50"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-square rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary-foreground">
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  {isFav && (
                    <Badge className="bg-red-500 text-white">
                      <Heart className="h-3 w-3 mr-1 fill-white" />
                      Favorito
                    </Badge>
                  )}
                </div>
                {product.description && (
                  <p className="text-muted-foreground mt-3 text-lg">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Price Section */}
              <Card>
                <CardContent className="p-6">
                  {hasVariations ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Variações</h3>
                      <div className="space-y-3">
                        {variations.map((variation) => (
                          <div
                            key={variation.id}
                            className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                          >
                            <span className="font-medium">{variation.name}</span>
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(variation.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Preço</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(product.price, product.unit)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Establishment Link */}
              {establishment && (
                <Link to={`/estabelecimento/${establishment.id}`}>
                  <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      {establishment.profile_image ? (
                        <img
                          src={establishment.profile_image}
                          alt={establishment.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Vendido por</p>
                        <p className="font-semibold">{establishment.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Favorite Button */}
              <Button
                variant={isFav ? "outline" : "default"}
                className="w-full rounded-xl"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                {isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
