import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Clock, Tag, Share2, MessageCircle, Globe, MoreVertical, Heart, Copy, Loader2, Truck, Navigation, Building2, Store, Star, ChevronRight, Instagram, Mail, Flag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProductCard } from "@/components/ProductCard";
import { ReviewSection } from "@/components/ReviewSection";
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
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ratingOf, promoOf } from "@/lib/dbFields";
import { categoryLabels } from "@/config/categories";
import { websiteUrl, websiteLabel, instagramUrl, instagramHandle, mailtoUrl } from "@/lib/contactLinks";
import { Helmet } from "react-helmet-async";
import { EstablishmentMap } from "@/components/EstablishmentMap";
import { ReportDialog } from "@/components/ReportDialog";
import { buildLocalBusinessJsonLd, establishmentMetaDescription, jsonLdScript } from "@/lib/seo";

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
  website?: string | null;
  instagram?: string | null;
  contact_email?: string | null;
  google_maps_link: string | null;
  schedule: string;
  category: string;
  profile_image: string | null;
  banner_image: string | null;
  images: unknown;
  is_paid: boolean;
  has_delivery: boolean | null;
  reference_point?: string | null;
  state?: string | null;
  cep?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  delivery_type: string | null;
  delivery_other: string | null;
  has_pickup?: boolean | null;
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
  const [reportOpen, setReportOpen] = useState(false);

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
      if (error) throw error;
      return data as Establishment | null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("establishment_id", id);
      if (error) throw error;
      return (data || []).map((p) => {
        if (p.is_promotion && p.promotion_expiration && new Date(p.promotion_expiration) < new Date()) {
          return { ...p, is_promotion: false, promotion_description: null, promotion_expiration: null };
        }
        return p;
      }) as Product[];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

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

  const { data: photoRecords = [] } = useEstablishmentPhotos(id);

  const legacyImages = useMemo(() => {
    if (!establishment) return [];
    return Array.isArray(establishment.images) ? establishment.images as string[] : [];
  }, [establishment]);

  const allPhotos = useMemo(() => {
    const photoUrls = photoRecords.map(p => p.url);
    if (photoUrls.length > 0) return photoUrls;
    return legacyImages;
  }, [photoRecords, legacyImages]);

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
    if (!shared) shareViaWhatsApp(text, url);
  };

  const handleCopyLink = () => copyToClipboard(window.location.href);

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
  const activePromotions = products.filter((p) => promoOf(p).isActive);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const categoryName = categoryLabels[establishment.category] || establishment.category;
  const metaDescription = establishmentMetaDescription(establishment, categoryName);
  const metaImage = establishment.banner_image || establishment.profile_image || undefined;
  const hasWhatsapp = establishment.whatsapp && establishment.whatsapp.trim() !== "";
  const siteLink = websiteUrl(establishment.website) || websiteUrl(establishment.external_link);
  const hasSite = !!siteLink;
  const instagramLink = instagramUrl(establishment.instagram);
  const emailLink = mailtoUrl(establishment.contact_email);
  const profileImg = establishment.profile_image || (allPhotos.length > 0 ? allPhotos[0] : null);
  const ratingAvg = ratingOf(establishment).average;
  const ratingCount = ratingOf(establishment).count;

  const getDeliveryLabel = () => {
    if (!establishment.has_delivery) return null;
    if (establishment.delivery_type === "outro" && establishment.delivery_other) return establishment.delivery_other;
    if (establishment.delivery_type) return deliveryTypeLabels[establishment.delivery_type] || establishment.delivery_type;
    return "Disponível";
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${establishment.name} | ${categoryName} em ${establishment.neighborhood || establishment.city || "sua região"} | Comércio Vizinho`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={establishment.name} />
        <meta property="og:description" content={metaDescription} />
        {metaImage && <meta property="og:image" content={metaImage} />}
        <script type="application/ld+json">{jsonLdScript(buildLocalBusinessJsonLd(establishment, pageUrl))}</script>
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleToggleFavorite}>
                <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportOpen(true)} className="cursor-pointer">
                    <Flag className="h-4 w-4 mr-2" />
                    Denunciar
                  </DropdownMenuItem>
                  {!roleLoading && !isAdmin && !establishment?.cnpj && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (user) navigate('/reivindicar-empresa');
                        else navigate('/auth', { state: { from: '/reivindicar-empresa' } });
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

      <main className="container mx-auto px-4 pb-8">
        {/* ===== CAPA ===== */}
        {establishment.banner_image && /^https?:\/\//i.test(establishment.banner_image) && (
          <div className="-mx-4 md:mx-0 md:mt-4 md:rounded-2xl overflow-hidden bg-muted h-32 sm:h-44 md:h-56">
            <img
              src={establishment.banner_image}
              alt={`Capa de ${establishment.name}`}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* ===== HERO: Profile Image + Info ===== */}
        <div className={`flex flex-col items-center pb-4 ${establishment.banner_image ? "-mt-12 md:-mt-14 relative" : "pt-6"}`}>
          {/* Profile Image - centered, rounded */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-background shadow-lg bg-muted flex-shrink-0">
            {profileImg ? (
              <img
                src={profileImg}
                alt={establishment.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <Store className="w-10 h-10 md:w-14 md:h-14 text-primary" />
              </div>
            )}
          </div>

          {/* Name + Rating + Category */}
          <div className="text-center mt-4 space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{establishment.name}</h1>

            {/* Rating */}
            <div className="flex items-center justify-center gap-2">
              {ratingAvg > 0 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold text-sm">{ratingAvg.toFixed(1)}</span>
                </div>
              )}
              {ratingCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({ratingCount} {ratingCount === 1 ? "avaliação" : "avaliações"})
                </span>
              )}
            </div>

            {/* Category + Location badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {categoryLabels[establishment.category] || establishment.category}
              </Badge>
              {establishment.neighborhood && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {establishment.neighborhood}
                  {establishment.city ? ` · ${establishment.city}` : ""}
                </span>
              )}
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                scheduleStatus.color === 'text-green-600' || scheduleStatus.color === 'text-green-500'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  scheduleStatus.color === 'text-green-600' || scheduleStatus.color === 'text-green-500'
                    ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {scheduleStatus.text}
              </span>
            </div>
          </div>
        </div>

        {/* ===== QUICK INFO CARDS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {/* Schedule */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Horário</p>
              <p className="text-xs font-medium text-foreground line-clamp-2">{establishment.schedule}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
            <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Telefone</p>
              <a
                href={`tel:${establishment.phone}`}
                onClick={handlePhoneClick}
                className="text-xs font-medium text-primary hover:underline"
              >
                {establishment.phone}
              </a>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
            <Truck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Delivery e retirada</p>
              <p className={`text-xs font-medium ${establishment.has_delivery || establishment.has_pickup ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {[getDeliveryLabel() ? `Delivery: ${getDeliveryLabel()}` : null, establishment.has_pickup ? "Retirada no local" : null]
                  .filter(Boolean)
                  .join(" · ") || "Não informado"}
              </p>
            </div>
          </div>

          {/* Endereço (resumo; o mapa completo vem logo abaixo) */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
            <Navigation className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Endereço</p>
              <p className="text-xs font-medium text-foreground leading-snug">
                {establishment.address}
                {establishment.neighborhood ? `, ${establishment.neighborhood}` : ""}
                {establishment.city ? ` - ${establishment.city}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ===== WHATSAPP CTA BUTTON ===== */}
        <div className="flex gap-2 mb-6">
          {hasWhatsapp && (
            <Button
              size="lg"
              className="flex-1 gap-2 rounded-xl h-12 text-base font-semibold shadow-md"
              onClick={() => {
                window.open(formatWhatsApp(establishment.whatsapp!), '_blank');
                handlePhoneClick();
              }}
            >
              <MessageCircle className="h-5 w-5" />
              Conversar no WhatsApp
            </Button>
          )}
          {hasSite && (
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-xl h-12"
              onClick={() => window.open(siteLink!, '_blank', 'noopener,noreferrer')}
            >
              <Globe className="h-5 w-5" />
              <span className="hidden sm:inline">Site</span>
            </Button>
          )}
        </div>

        {/* ===== FICHA DA EMPRESA: site, Instagram e e-mail ===== */}
        {(hasSite || instagramLink || emailLink) && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
            <h2 className="text-sm font-semibold">Contato e links</h2>
            {hasSite && (
              <a href={siteLink!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {websiteLabel(establishment.website) || websiteLabel(establishment.external_link)}
              </a>
            )}
            {instagramLink && (
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                <Instagram className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {instagramHandle(establishment.instagram)}
              </a>
            )}
            {emailLink && (
              <a href={emailLink} className="flex items-center gap-2 text-sm hover:underline">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {establishment.contact_email}
              </a>
            )}
          </div>
        )}

        {/* ===== LOCALIZAÇÃO ===== */}
        <EstablishmentMap
          name={establishment.name}
          address={[establishment.address, establishment.neighborhood, establishment.city].filter(Boolean).join(", ")}
          referencePoint={establishment.reference_point}
          latitude={establishment.latitude}
          longitude={establishment.longitude}
          googleMapsLink={establishment.google_maps_link}
        />

        {/* ===== DESCRIPTION ===== */}
        {establishment.description && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{establishment.description}</p>
          </div>
        )}

        {/* ===== PROMOÇÕES (só as que estão valendo) ===== */}
        {activePromotions.length > 0 && (
          <section className="mb-6" aria-labelledby="promocoes-titulo">
            <h2 id="promocoes-titulo" className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
              Promoções ({activePromotions.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activePromotions.map((product) => (
                <ProductCard
                  key={`promo-${product.id}`}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  image={product.image}
                  images={product.images as string[] | null}
                  unit={product.unit}
                  isPromotion
                  promotionDescription={promoOf(product).description}
                />
              ))}
            </div>
          </section>
        )}

        {/* ===== TABS: FOTOS / PRODUTOS ===== */}
        {(allPhotos.length > 1 || products.length > 0) && (
          <Tabs defaultValue={products.length > 0 ? "produtos" : "fotos"} className="mb-6">
            <TabsList className="w-full">
              {allPhotos.length > 1 && (
                <TabsTrigger value="fotos" className="flex-1 gap-1.5">
                  📷 Fotos ({allPhotos.length})
                </TabsTrigger>
              )}
              {products.length > 0 && (
                <TabsTrigger value="produtos" className="flex-1 gap-1.5">
                  🛒 Produtos ({products.length})
                </TabsTrigger>
              )}
            </TabsList>

            {allPhotos.length > 1 && (
              <TabsContent value="fotos">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {allPhotos.map((photo, idx) => (
                    <div key={idx} className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                      <img
                        src={photo}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {products.length > 0 && (
              <TabsContent value="produtos">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                        isPromotion={promoOf(product).isPromotion}
                        promotionDescription={promoOf(product).description}
                      />
                    );
                  })}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* ===== REVIEWS ===== */}
        <div className="mb-6">
          <ReviewSection
            establishmentId={id!}
            ratingAverage={ratingAvg}
            ratingCount={ratingCount}
          />
        </div>

        {/* ===== LEGAL DISCLAIMER ===== */}
        <div className="border-t pt-4 mt-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
            ⚠️ O Comércio Vizinho é apenas uma plataforma de divulgação. Não intermediamos pagamentos,
            entregas ou negociações.{" "}
            <Link to="/termos-de-uso" className="text-primary hover:underline">
              Termos e Responsabilidades
            </Link>
          </p>
        </div>
      </main>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="establishment"
        targetId={establishment.id}
        targetName={establishment.name}
      />
    </div>
  );
}
