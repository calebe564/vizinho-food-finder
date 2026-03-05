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
import { 
  ArrowLeft, Heart, Store, ImageIcon, Loader2, 
  MessageCircle, Navigation, Clock, Phone, MapPin,
  Truck, ShieldCheck, ShieldAlert
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { OpenClosedBadge, DeliveryBadge } from "@/components/StatusBadge";

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
  phone: string;
  whatsapp: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  state: string | null;
  schedule: string;
  has_delivery: boolean | null;
  google_maps_link: string | null;
  cnpj: string | null;
  category: string;
  active?: boolean;
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

  const { data: establishment, isLoading: establishmentLoading, isError: establishmentError } = useQuery({
    queryKey: ["establishment-for-product-detail", product?.establishment_id],
    queryFn: async () => {
      if (!product?.establishment_id) return null;
      
      const { data, error } = await supabase
        .from("establishments")
        .select("id, name, profile_image, phone, whatsapp, address, neighborhood, city, state, schedule, has_delivery, google_maps_link, cnpj, category, active")
        .eq("id", product.establishment_id)
        .maybeSingle();

      if (error) throw error;
      
      // Verificar se o estabelecimento está ativo
      if (data && !data.active) {
        console.warn('Establishment is inactive:', product.establishment_id);
        return null;
      }
      
      return data as Establishment | null;
    },
    enabled: !!product?.establishment_id,
    retry: 1, // Limitar tentativas para não travar a UI
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
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      imgs.push(...product.images);
    } else if (product.image) {
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

  // WhatsApp link with pre-filled message
  const getWhatsAppLink = () => {
    const phone = establishment?.whatsapp || establishment?.phone;
    if (!phone) return null;
    
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    
    const priceText = hasVariations 
      ? formatPrice(variations[0].price)
      : formatPrice(product?.price || 0, product?.unit);
    
    const message = encodeURIComponent(
      `Olá! Encontrei seu produto no Comércio Vizinho.\n\nProduto: ${product?.name}\nPreço: ${priceText}\n\nGostaria de fazer um pedido.`
    );
    
    return `https://wa.me/${phoneWithCode}?text=${message}`;
  };

  // Google Maps link
  const getMapsLink = () => {
    if (establishment?.google_maps_link) {
      return establishment.google_maps_link;
    }
    if (establishment?.address || establishment?.neighborhood) {
      const query = [establishment.address, establishment.neighborhood, establishment.city]
        .filter(Boolean)
        .join(", ");
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    return null;
  };

  const whatsappLink = getWhatsAppLink();
  const mapsLink = getMapsLink();
  const isPJ = !!establishment?.cnpj;

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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 bg-background/80 hover:bg-background rounded-full"
                      onClick={handleToggleFavorite}
                    >
                      <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
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

              {/* Action Buttons - WhatsApp & Maps */}
              <div className="grid grid-cols-2 gap-3">
                {whatsappLink ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Comprar via WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" disabled className="opacity-50">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Sem WhatsApp
                  </Button>
                )}

                {mapsLink ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                      <Navigation className="w-5 h-5 mr-2" />
                      Ver Localização
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" disabled className="opacity-50">
                    <Navigation className="w-5 h-5 mr-2" />
                    Sem endereço
                  </Button>
                )}
              </div>

              {/* Establishment Card with Full Info */}
              {establishment && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <Link 
                      to={`/estabelecimento/${establishment.id}`}
                      className="block p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {establishment.profile_image ? (
                          <img
                            src={establishment.profile_image}
                            alt={establishment.name}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <Store className="h-7 w-7 text-primary-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Vendido por</p>
                          <p className="font-bold text-lg">{establishment.name}</p>
                        </div>
                      </div>
                    </Link>

                    {/* Status Badges */}
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      <OpenClosedBadge schedule={establishment.schedule} size="md" />
                      <DeliveryBadge hasDelivery={establishment.has_delivery} size="md" />
                    </div>

                    {/* Establishment Details */}
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                      {/* Schedule */}
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Horário de Funcionamento</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {establishment.schedule || "Não informado"}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Endereço</p>
                          <p className="text-sm text-muted-foreground">
                            {[establishment.address, establishment.neighborhood, establishment.city, establishment.state]
                              .filter(Boolean)
                              .join(", ") || "Não informado"}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Telefone</p>
                          <p className="text-sm text-muted-foreground">
                            {establishment.phone || "Não informado"}
                          </p>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            {establishment.has_delivery ? "Entrega disponível" : "Sem delivery"}
                          </p>
                        </div>
                      </div>

                      {/* Business Type Badge (PJ/PF) */}
                      <div className="pt-2">
                        {isPJ ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            Pessoa Jurídica – Garantia
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1.5">
                            <ShieldAlert className="w-4 h-4" />
                            Pessoa Física – Sem Garantia
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
