import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Clock, Tag, Share2, MessageCircle, Globe, MoreVertical, Heart, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ProductCard } from "@/components/ProductCard";
import { getScheduleStatus } from "@/lib/scheduleUtils";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { shareContent, shareViaWhatsApp, copyToClipboard } from "@/lib/shareUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Establishment {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  phone: string;
  whatsapp: string | null;
  external_link: string | null;
  schedule: string;
  category: string;
  profile_image: string | null;
  banner_image: string | null;
  images: unknown;
  is_paid: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
  images: unknown;
  unit: string | null;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  product_id: string;
}

export default function EstablishmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = id ? isFavorite(id) : false;

  useEffect(() => {
    if (id) {
      fetchEstablishment();
      fetchProducts();
      incrementPageViews();
    }
  }, [id]);

  const fetchEstablishment = async () => {
    const { data, error } = await supabase
      .from("establishments")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setEstablishment(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("establishment_id", id);

    if (!error && data) {
      setProducts(data as Product[]);
      
      // Fetch variations for all products
      if (data.length > 0) {
        const productIds = data.map(p => p.id);
        const { data: varsData } = await supabase
          .from("product_variations")
          .select("*")
          .in("product_id", productIds);
        
        if (varsData) {
          setVariations(varsData as ProductVariation[]);
        }
      }
    }
  };

  const incrementPageViews = async () => {
    const { data: stat } = await supabase
      .from("establishment_statistics")
      .select("page_views")
      .eq("establishment_id", id)
      .maybeSingle();

    if (stat) {
      await supabase
        .from("establishment_statistics")
        .update({ page_views: stat.page_views + 1 })
        .eq("establishment_id", id);
    }
  };

  const handlePhoneClick = async () => {
    const { data: stat } = await supabase
      .from("establishment_statistics")
      .select("phone_clicks")
      .eq("establishment_id", id)
      .maybeSingle();

    if (stat) {
      await supabase
        .from("establishment_statistics")
        .update({ phone_clicks: stat.phone_clicks + 1 })
        .eq("establishment_id", id);
    }
  };

  const formatWhatsApp = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    return `https://wa.me/${number}`;
  };

  const handleShare = async () => {
    if (!establishment) return;
    
    const url = window.location.href;
    const text = `Conheça ${establishment.name} no Comércio Vizinho!`;
    
    const shared = await shareContent({ title: establishment.name, text, url });
    
    if (!shared) {
      shareViaWhatsApp(text, url);
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(window.location.href);
  };

  const handleToggleFavorite = () => {
    if (!id) return;
    const newState = toggleFavorite(id);
    toast.success(newState ? "Adicionado aos favoritos!" : "Removido dos favoritos");
  };

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
  };

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const scheduleStatus = getScheduleStatus(establishment.schedule);
  const hasWhatsapp = establishment.whatsapp && establishment.whatsapp.trim() !== "";
  const hasSite = establishment.external_link && establishment.external_link.trim() !== "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {/* Menu de 3 pontos */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={handleToggleFavorite} className="cursor-pointer">
                    <Heart className={`h-4 w-4 mr-2 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    {isFav ? "Remover dos favoritos" : "Favoritar empresa"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 relative">
          {(() => {
            const images = Array.isArray(establishment.images) ? establishment.images as string[] : [];
            if (images.length > 0) {
              return <ImageCarousel images={images} />;
            } else if (establishment.banner_image || establishment.profile_image) {
              return (
                <img
                  src={establishment.banner_image || establishment.profile_image}
                  alt={establishment.name}
                  className="w-full h-64 md:h-96 object-cover rounded-xl"
                />
              );
            } else {
              return (
                <div className="w-full h-64 md:h-96 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">
                    {establishment.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              );
            }
          })()}
          
          {/* Favorite indicator */}
          {isFav && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-red-500 text-white shadow-lg">
                <Heart className="h-3 w-3 mr-1 fill-white" />
                Favorito
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{establishment.name}</h1>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {categoryLabels[establishment.category]}
                      </Badge>
                      {establishment.neighborhood && (
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {establishment.neighborhood}
                        </Badge>
                      )}
                      {establishment.is_paid && (
                        <Badge variant="default">Destaque</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {establishment.description && (
                  <p className="text-muted-foreground">{establishment.description}</p>
                )}

                {/* Action buttons - WhatsApp e Site lado a lado */}
                <div className="flex gap-3 mt-6">
                  {hasWhatsapp && (
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={() => {
                        window.open(formatWhatsApp(establishment.whatsapp!), '_blank');
                        handlePhoneClick();
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                  {hasSite && (
                    <Button 
                      variant="outline"
                      className="flex-1 gap-2" 
                      onClick={() => window.open(establishment.external_link!, '_blank')}
                    >
                      <Globe className="h-4 w-4" />
                      Site
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {products.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Produtos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {products.map((product) => {
                      const productVariations = variations.filter(v => v.product_id === product.id);
                      const hasVariations = productVariations.length > 0;
                      const prices = productVariations.map(v => v.price);
                      
                      return (
                        <ProductCard
                          key={product.id}
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">{establishment.schedule}</p>
                    <p className={`text-sm font-semibold mt-1 ${scheduleStatus.color}`}>
                      {scheduleStatus.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">{establishment.address}</p>
                    {establishment.neighborhood && (
                      <p className="text-sm text-muted-foreground">Bairro: {establishment.neighborhood}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <a
                      href={`tel:${establishment.phone}`}
                      onClick={handlePhoneClick}
                      className="text-sm text-primary hover:underline"
                    >
                      {establishment.phone}
                    </a>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full gap-2" 
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                  <Button 
                    variant={isFav ? "default" : "secondary"}
                    className="w-full gap-2" 
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? "fill-white" : ""}`} />
                    {isFav ? "Favoritado" : "Favoritar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
