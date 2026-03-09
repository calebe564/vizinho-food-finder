import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Clock, Tag, Share2, MessageCircle, Globe, MoreVertical, Heart, Copy, Loader2, Truck, Navigation, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ImageGallery } from "@/components/ImageGallery";
import { ProductCard } from "@/components/ProductCard";
import { ReviewSection } from "@/components/ReviewSection";
import { RatingBadge } from "@/components/StarRating";
import { getScheduleStatus } from "@/lib/scheduleUtils";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { shareContent, shareViaWhatsApp, copyToClipboard } from "@/lib/shareUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEstablishmentPhotos } from "@/hooks/useEstablishmentPhotos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useMemo } from "react";

interface Establishment {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  phone: string;
  whatsapp: string | null;
  external_link: string | null;
  google_maps_link: string | null;
  schedule: string;
  category: string;
  profile_image: string | null;
  banner_image: string | null;
  images: unknown;
  is_paid: boolean;
  has_delivery: boolean | null;
  delivery_type: string | null;
  delivery_other: string | null;
  cnpj: string | null;
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

const deliveryTypeLabels: Record<string, string> = {
  proprio: "Delivery Próprio",
  ifood: "iFood",
  uber_eats: "Uber Eats",
  outro: "Outro",
};

export default function EstablishmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = id ? isFavorite(id) : false;

  // Fetch establishment with React Query for caching
  const { data: establishment, isLoading: establishmentLoading, isError } = useQuery({
    queryKey: ["establishment", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching establishment:', error);
        throw error;
      }
      return data as Establishment | null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Fetch products with React Query — filter expired promotions client-side
  const { data: products = [] } = useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("establishment_id", id);

      if (error) throw error;
      // Clear expired promotion data client-side (DB trigger handles it on write)
      return (data || []).map((p: any) => {
        if (p.is_promotion && p.promotion_expiration && new Date(p.promotion_expiration) < new Date()) {
          return { ...p, is_promotion: false, promotion_description: null, promotion_expiration: null };
        }
        return p;
      }) as Product[];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch all variations for products
  const productIds = products.map(p => p.id);
  const { data: variations = [] } = useQuery({
    queryKey: ["product-variations-list", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .in("product_id", productIds);

      if (error) throw error;
      return (data || []) as ProductVariation[];
    },
    enabled: productIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch photos from establishment_photos table (must be before early returns)
  const { data: photoRecords = [] } = useEstablishmentPhotos(id);

  // Merge: establishment_photos URLs first, then legacy JSONB images as fallback
  const legacyImages = useMemo(() => {
    if (!establishment) return [];
    return Array.isArray(establishment.images) ? establishment.images as string[] : [];
  }, [establishment]);

  const allPhotos = useMemo(() => {
    const photoUrls = photoRecords.map(p => p.url);
    if (photoUrls.length > 0) return photoUrls;
    return legacyImages;
  }, [photoRecords, legacyImages]);

  // Increment page views (fire and forget)
  useEffect(() => {
    if (id) {
      supabase
        .from("establishment_statistics")
        .select("page_views")
        .eq("establishment_id", id)
        .maybeSingle()
        .then(({ data: stat }) => {
          if (stat) {
            supabase
              .from("establishment_statistics")
              .update({ page_views: (stat.page_views || 0) + 1 })
              .eq("establishment_id", id)
              .then(() => {});
          }
        });
    }
  }, [id]);

  const handlePhoneClick = async () => {
    const { data: stat } = await supabase
      .from("establishment_statistics")
      .select("phone_clicks")
      .eq("establishment_id", id)
      .maybeSingle();

    if (stat) {
      await supabase
        .from("establishment_statistics")
        .update({ phone_clicks: (stat.phone_clicks || 0) + 1 })
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

  if (establishmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment || isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Estabelecimento não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Este estabelecimento pode ter sido removido ou não está mais disponível.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
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
                  {/* Claim button: HIDDEN for admins and only shown when business has no owner */}
                  {!roleLoading && !isAdmin && !establishment?.cnpj && (
                    <DropdownMenuItem 
                      onClick={() => {
                        if (user) {
                          navigate('/reivindicar-empresa');
                        } else {
                          navigate('/auth', { state: { from: '/reivindicar-empresa' } });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Reivindicar Empresa
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 relative">
          {allPhotos.length > 0 ? (
            <ImageGallery images={allPhotos} />
          ) : establishment.banner_image || establishment.profile_image ? (
            <img
              src={establishment.banner_image || establishment.profile_image}
              alt={establishment.name}
              className="w-full h-56 md:h-80 lg:h-[400px] object-cover object-center rounded-xl"
              loading="eager"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-6xl font-bold text-white">
                {establishment.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
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
                    <div className="flex items-center gap-3 mb-2">
                      <RatingBadge 
                        average={(establishment as any).rating_average || 0} 
                        count={(establishment as any).rating_count || 0} 
                      />
                    </div>
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
                          isPromotion={(product as any).is_promotion}
                          promotionDescription={(product as any).promotion_description}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <ReviewSection 
              establishmentId={id!} 
              ratingAverage={(establishment as any).rating_average || 0}
              ratingCount={(establishment as any).rating_count || 0}
            />
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
                  <div className="flex-1">
                    <p className="font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">{establishment.address}</p>
                    {establishment.neighborhood && (
                      <p className="text-sm text-muted-foreground">
                        {establishment.neighborhood}{establishment.city ? ` · ${establishment.city}` : ""}
                      </p>
                    )}
                    {establishment.google_maps_link && (
                      <Button 
                        variant="link" 
                        className="h-auto p-0 mt-1 text-primary gap-1"
                        onClick={() => window.open(establishment.google_maps_link!, '_blank')}
                      >
                        <Navigation className="h-3 w-3" />
                        Ver no Maps
                      </Button>
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

                {/* Delivery Info - ALWAYS VISIBLE */}
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery</p>
                    {establishment.has_delivery ? (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ {establishment.delivery_type === "outro" && establishment.delivery_other
                          ? establishment.delivery_other
                          : establishment.delivery_type
                            ? deliveryTypeLabels[establishment.delivery_type] || establishment.delivery_type
                            : "Disponível"
                        }
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Não disponível
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  {establishment.google_maps_link && (
                    <Button 
                      variant="outline"
                      className="w-full gap-2" 
                      onClick={() => window.open(establishment.google_maps_link!, '_blank')}
                    >
                      <Navigation className="h-4 w-4" />
                      Ver no Maps
                    </Button>
                  )}
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

                {/* Legal Disclaimer */}
                <div className="pt-3 border-t mt-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ⚠️ O Comércio Vizinho é apenas uma plataforma de divulgação. Não intermediamos pagamentos, 
                    entregas ou negociações.{" "}
                    <Link to="/termos-de-uso" className="text-primary hover:underline">
                      Termos e Responsabilidades
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* NOTE: "Reivindicar Empresa" removed from public page - only available in user menu */}
          </div>
        </div>
      </main>
    </div>
  );
}