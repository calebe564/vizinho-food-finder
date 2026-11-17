import { useState, useEffect, useMemo, useCallback } from "react";
import { applyWeightedRanking, type PlanWeight } from "@/lib/weightedRanking";
import { usePlanConfigs } from "@/hooks/usePlanConfig";
import { supabase } from "@/integrations/supabase/client";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SearchBar } from "@/components/SearchBar";
import { FilterSheet } from "@/components/FilterSheet";
import { EstablishmentCardCompact } from "@/components/EstablishmentCardCompact";
import { ProductCardExtended } from "@/components/ProductCardExtended";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import { LocationFilter } from "@/components/LocationFilterModal";
import { sortEstablishments, sortProducts, matchesCategory } from "@/lib/sortingUtils";
import { areNeighborhoodsEquivalent, matchesNormalizedNeighborhood } from "@/lib/locationUtils";
import { isOpenNow } from "@/lib/scheduleUtils";
import { useMainPhotosMap } from "@/hooks/useEstablishmentPhotos";

import { useUserLocation } from "@/contexts/LocationContext";
import { Link, useSearchParams } from "react-router-dom";
import { Store, Loader2, Building2, Package, ChevronLeft, ChevronRight, UtensilsCrossed, ShoppingCart, Croissant, MoreHorizontal, IceCream, Beef, Flame, Pizza, Beer, Coffee, Drumstick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ratingOf, promoOf } from "@/lib/dbFields";

interface Establishment {
  id: string;
  name: string;
  category: string;
  category_2: string | null;
  category_3: string | null;
  address: string;
  neighborhood: string | null;
  neighborhood_normalized: string | null;
  region: string | null;
  city: string;
  state: string | null;
  whatsapp: string | null;
  external_link: string | null;
  schedule: string;
  profile_image: string | null;
  banner_image: string | null;
  images: unknown;
  is_paid: boolean;
  is_destaque: boolean;
  has_delivery: boolean | null;
  plan: string;
}

interface ProductWithEstablishment {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
  unit: string | null;
  is_promotion: boolean;
  promotion_description: string | null;
  establishment_id: string;
  establishment_schedule: string;
  establishment_name: string;
  establishment_category: string;
  establishment_image: string | null;
  establishment_neighborhood: string | null;
  establishment_neighborhood_normalized: string | null;
  establishment_city: string | null;
  establishment_state: string | null;
  establishment_phone: string | null;
  establishment_whatsapp: string | null;
  establishment_has_delivery: boolean | null;
  establishment_address: string | null;
  establishment_google_maps_link: string | null;
}

interface Product {
  establishment_id: string;
  name: string;
  price: number;
}

interface Advertisement {
  id: string;
  image: string;
  title: string | null;
  text: string | null;
  link: string | null;
  position: string;
  size: string;
  behavior: string;
  display_order: number;
}

interface LocationSelection {
  neighborhood: string;
  region: string;
  city: string;
  state: string;
}

const ITEMS_PER_PAGE = 12;

const quickCategories = [
  { value: "todos", label: "Todos", icon: Store },
  { value: "restaurante", label: "Restaurante", icon: UtensilsCrossed },
  { value: "lanchonete", label: "Lanchonete", icon: UtensilsCrossed },
  { value: "padaria", label: "Padaria", icon: Croissant },
  { value: "supermercado", label: "Mercado", icon: ShoppingCart },
  { value: "açougue", label: "Açougue", icon: Beef },
  { value: "hortifruti", label: "Hortifruti", icon: ShoppingCart },
  { value: "pizzaria", label: "Pizzaria", icon: Pizza },
  { value: "hamburgueria", label: "Hamburgueria", icon: UtensilsCrossed },
  { value: "bar", label: "Bar", icon: Beer },
  { value: "cafe", label: "Café", icon: Coffee },
  { value: "sorveteria", label: "Sorveteria", icon: IceCream },
  { value: "acai", label: "Açaí", icon: IceCream },
  { value: "espetinho", label: "Espetinho", icon: Drumstick },
  { value: "outro", label: "Outro", icon: MoreHorizontal },
];

export default function Home() {
  const [searchParams] = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProductsWithEstablishment, setAllProductsWithEstablishment] = useState<ProductWithEstablishment[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"products" | "companies">("products");
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
  const [sortBy, setSortBy] = useState("proximity");
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: planConfigs } = usePlanConfigs();
  const planWeights: PlanWeight[] = useMemo(() => {
    if (!planConfigs) return [];
    return planConfigs.map(c => ({
      plan_name: c.plan_name,
      visibility_weight: c.visibility_weight,
      promotion_boost: c.promotion_boost,
    }));
  }, [planConfigs]);

  const { locationDetails, hasPermission } = useUserLocation();

  useEffect(() => {
    if (locationFilter) {
      setSelectedLocation({
        neighborhood: locationFilter.neighborhood,
        region: "",
        city: locationFilter.city,
        state: locationFilter.state
      });
    } else if (locationDetails && hasPermission) {
      setSelectedLocation({
        neighborhood: locationDetails.neighborhood,
        region: locationDetails.region,
        city: locationDetails.city,
        state: locationDetails.state
      });
    }
  }, [locationFilter, locationDetails, hasPermission]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [establishmentsRes, productsRes, adsRes, productsDetailedRes] = await Promise.all([
        supabase.from("establishments").select("*").eq("active", true),
        supabase.from("products").select("establishment_id, name, price"),
        supabase.from("advertisements").select("*").eq("active", true),
        supabase.from("products").select(`
          id, name, price, description, image, unit, establishment_id, is_promotion, promotion_description,
          establishments!inner(id, name, category, profile_image, neighborhood, neighborhood_normalized, city, state, active, schedule, phone, whatsapp, has_delivery, address, google_maps_link)
        `).limit(500)
      ]);
      
      if (establishmentsRes.data) setEstablishments(establishmentsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (adsRes.data) setAdvertisements(adsRes.data);
      
      if (productsDetailedRes.data) {
        const mappedProducts: ProductWithEstablishment[] = productsDetailedRes.data
          .filter((p) => p.establishments?.active)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
            image: p.image,
            unit: p.unit || null,
            is_promotion: promoOf(p).expired ? false : promoOf(p).isPromotion,
            promotion_description: promoOf(p).expired ? null : (promoOf(p).description || null),
            establishment_id: p.establishment_id,
            establishment_schedule: p.establishments?.schedule || "",
            establishment_name: p.establishments?.name || "",
            establishment_category: p.establishments?.category || "",
            establishment_image: p.establishments?.profile_image || null,
            establishment_neighborhood: p.establishments?.neighborhood || null,
            establishment_neighborhood_normalized: p.establishments?.neighborhood_normalized || null,
            establishment_city: p.establishments?.city || null,
            establishment_state: p.establishments?.state || null,
            establishment_phone: p.establishments?.phone || null,
            establishment_whatsapp: p.establishments?.whatsapp || null,
            establishment_has_delivery: p.establishments?.has_delivery ?? false,
            establishment_address: p.establishments?.address || null,
            establishment_google_maps_link: p.establishments?.google_maps_link || null,
          }));
        setAllProductsWithEstablishment(mappedProducts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAdsByPosition = (position: string) => advertisements.filter(ad => ad.position === position);
  const getEstablishmentProducts = (establishmentId: string) => products.filter((p) => p.establishment_id === establishmentId);

  // Filter products for product search mode
  const filteredProducts = useMemo(() => {
    if (!searchTerm || searchMode !== "products") return [];
    
    const searchLower = searchTerm.toLowerCase();
    
    const filtered = allProductsWithEstablishment.filter((product) => {
      const matchesProduct = product.name.toLowerCase().includes(searchLower);
      const matchesCategoryFilter = category === "todos" || product.establishment_category === category;
      
      if (locationFilter) {
        const matchesLocation = matchesNormalizedNeighborhood(
          product.establishment_neighborhood_normalized,
          locationFilter.neighborhood
        ) || areNeighborhoodsEquivalent(
          product.establishment_neighborhood || '',
          locationFilter.neighborhood
        );
        return matchesProduct && matchesCategoryFilter && matchesLocation;
      }
      
      return matchesProduct && matchesCategoryFilter;
    });
    
    return filtered
      .map(product => ({
        ...product,
        isEstablishmentOpen: isOpenNow(product.establishment_schedule),
      }))
      .sort((a, b) => {
        if (a.isEstablishmentOpen && !b.isEstablishmentOpen) return -1;
        if (!a.isEstablishmentOpen && b.isEstablishmentOpen) return 1;
        
        if (selectedLocation) {
          const aMatch = matchesNormalizedNeighborhood(a.establishment_neighborhood_normalized, selectedLocation.neighborhood) ||
                         areNeighborhoodsEquivalent(a.establishment_neighborhood || '', selectedLocation.neighborhood);
          const bMatch = matchesNormalizedNeighborhood(b.establishment_neighborhood_normalized, selectedLocation.neighborhood) ||
                         areNeighborhoodsEquivalent(b.establishment_neighborhood || '', selectedLocation.neighborhood);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
        }
        
        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [allProductsWithEstablishment, searchTerm, searchMode, category, selectedLocation, locationFilter]);

  const filteredEstablishments = useMemo(() => {
    let filtered = establishments;
    if (locationFilter) {
      filtered = establishments.filter(est => 
        matchesNormalizedNeighborhood(est.neighborhood_normalized, locationFilter.neighborhood) ||
        areNeighborhoodsEquivalent(est.neighborhood || '', locationFilter.neighborhood)
      );
    }
    
    filtered = filtered.filter((est) => {
      const searchLower = searchTerm.toLowerCase();
      
      if (!searchTerm) {
        return matchesCategory(est, category);
      }
      
      if (searchMode === "products") {
        return false;
      }
      
      const matchesName = est.name.toLowerCase().includes(searchLower);
      const matchesCat = est.category.toLowerCase().includes(searchLower) ||
                         (est.category_2 && est.category_2.toLowerCase().includes(searchLower)) ||
                         (est.category_3 && est.category_3.toLowerCase().includes(searchLower));
      const matchesCategoryFilter = matchesCategory(est, category);
      
      return (matchesName || matchesCat) && matchesCategoryFilter;
    });
    
    const sorted = filtered
      .map((est) => ({
        ...est,
        isOpen: isOpenNow(est.schedule),
      }))
      .sort((a, b) => {
        // Open establishments always first
        if (a.isOpen && !b.isOpen) return -1;
        if (!a.isOpen && b.isOpen) return 1;
        
        // Proximity grouping
        if (sortBy === "proximity" && selectedLocation) {
          const aMatch = matchesNormalizedNeighborhood(a.neighborhood_normalized, selectedLocation.neighborhood) ||
                         areNeighborhoodsEquivalent(a.neighborhood || '', selectedLocation.neighborhood);
          const bMatch = matchesNormalizedNeighborhood(b.neighborhood_normalized, selectedLocation.neighborhood) ||
                         areNeighborhoodsEquivalent(b.neighborhood || '', selectedLocation.neighborhood);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
        }
        if (sortBy === "name-asc") return a.name.localeCompare(b.name, 'pt-BR');
        if (sortBy === "name-desc") return b.name.localeCompare(a.name, 'pt-BR');
        
        return a.name.localeCompare(b.name, 'pt-BR');
      });

    // Apply weighted probabilistic ranking within open/closed groups
    if (sortBy === "proximity" && planWeights.length > 0) {
      return applyWeightedRanking(
        sorted.map(s => ({ ...s, plan: s.plan || 'gratuito' })),
        planWeights,
        (item) => item.isOpen ? 'open' : 'closed'
      );
    }

    return sorted;
  }, [establishments, searchTerm, searchMode, category, sortBy, selectedLocation, locationFilter, planWeights]);

  const showProductResults = searchMode === "products" && searchTerm && filteredProducts.length > 0;
  const showEstablishments = !showProductResults || !searchTerm;

  const displayedEstIds = useMemo(() => filteredEstablishments.map(e => e.id), [filteredEstablishments]);
  const { data: mainPhotosMap = {} } = useMainPhotosMap(displayedEstIds);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchMode, category, sortBy]);

  const itemsToPage = showProductResults ? filteredProducts : filteredEstablishments;
  const totalPages = Math.ceil(itemsToPage.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return itemsToPage.slice(start, start + ITEMS_PER_PAGE);
  }, [itemsToPage, currentPage]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-6 pb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="gap-1 rounded-full h-9"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className="w-9 h-9 p-0 rounded-full"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Search section - sticky below header on mobile, like iFood */}
      <div className="sticky top-14 md:top-16 z-40 bg-background border-b border-border">
        <div className="container px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>
            {/* Search mode toggle - compact pills */}
            <div className="hidden md:flex items-center gap-1.5">
              <Button
                variant={searchMode === "products" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchMode("products")}
                className="rounded-full gap-1.5 h-9 px-3 text-xs"
              >
                <Package className="h-3.5 w-3.5" />
                Produtos
              </Button>
              <Button
                variant={searchMode === "companies" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchMode("companies")}
                className="rounded-full gap-1.5 h-9 px-3 text-xs"
              >
                <Building2 className="h-3.5 w-3.5" />
                Empresas
              </Button>
            </div>
          </div>
          
          {/* Mobile search mode toggle */}
          <div className="flex md:hidden items-center justify-center gap-2 mt-2">
            <Button
              variant={searchMode === "products" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("products")}
              className="rounded-full gap-1.5 h-8 px-3 text-xs flex-1 max-w-[160px]"
            >
              <Package className="h-3.5 w-3.5" />
              Produtos
            </Button>
            <Button
              variant={searchMode === "companies" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("companies")}
              className="rounded-full gap-1.5 h-8 px-3 text-xs flex-1 max-w-[160px]"
            >
              <Building2 className="h-3.5 w-3.5" />
              Empresas
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Category quick scroll - iFood style */}
        <div className="bg-background border-b border-border">
          <div className="container px-0 md:px-4">
            <div className="flex overflow-x-auto scrollbar-thin gap-0 py-2 md:py-3 px-3 md:px-0">
              {quickCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 min-w-[64px] md:min-w-[72px] px-2 py-1.5 rounded-xl transition-all flex-shrink-0 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-button"
                        : "bg-secondary"
                    }`}>
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className={`text-[10px] md:text-xs font-medium leading-tight text-center line-clamp-1 ${
                      isActive ? "text-primary font-semibold" : ""
                    }`}>
                      {cat.label}
                    </span>
                    {isActive && (
                      <div className="w-5 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container px-3 md:px-4 py-3 md:py-4 space-y-4 md:space-y-5">
          {/* Top ads */}
          <AdvertisementBanner advertisements={getAdsByPosition("top")} />
          
          {/* Hero Carousel - highlights */}
          <div className="animate-fade-in">
            <HeroCarousel />
          </div>

          {/* Filter pills row */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <FilterSheet 
              category={category} 
              onCategoryChange={setCategory} 
              sortBy={sortBy} 
              onSortChange={setSortBy}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
            />
          </div>

          {/* Results Section */}
          <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {showProductResults ? (
                  <>
                    <Package className="h-5 w-5 text-primary" />
                    <h2 className="text-base md:text-lg font-bold text-foreground">
                      {loading ? "Carregando..." : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
                    </h2>
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 text-primary" />
                    <h2 className="text-base md:text-lg font-bold text-foreground">
                      {loading ? "Carregando..." : `${filteredEstablishments.length} ${filteredEstablishments.length === 1 ? 'empresa' : 'empresas'}`}
                    </h2>
                  </>
                )}
              </div>
              {!loading && filteredEstablishments.length > ITEMS_PER_PAGE && !showProductResults && (
                <Link to="/estabelecimentos" className="text-xs md:text-sm font-medium text-primary hover:underline">
                  Ver todos
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : showProductResults ? (
              filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-secondary/50 rounded-2xl">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-base font-medium text-muted-foreground">Nenhum produto encontrado</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Tente buscar por outro termo</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-3">
                    {(paginatedItems as ProductWithEstablishment[]).map((product) => (
                      <ProductCardExtended
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        description={product.description}
                        image={product.image}
                        unit={product.unit}
                        isPromotion={product.is_promotion}
                        promotionDescription={product.promotion_description}
                        establishment={{
                          id: product.establishment_id,
                          name: product.establishment_name,
                          category: product.establishment_category,
                          profileImage: product.establishment_image,
                          neighborhood: product.establishment_neighborhood,
                          city: product.establishment_city,
                          state: product.establishment_state,
                          schedule: product.establishment_schedule,
                          phone: product.establishment_phone || undefined,
                          whatsapp: product.establishment_whatsapp || undefined,
                          hasDelivery: product.establishment_has_delivery ?? false,
                          address: product.establishment_address || undefined,
                          googleMapsLink: product.establishment_google_maps_link,
                        }}
                      />
                    ))}
                  </div>
                  {renderPagination()}
                </>
              )
            ) : (
              filteredEstablishments.length === 0 ? (
                <div className="text-center py-16 bg-secondary/50 rounded-2xl">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-base font-medium text-muted-foreground">Nenhuma empresa encontrada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Tente ajustar os filtros</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
                    {(paginatedItems as typeof filteredEstablishments).map((est) => (
                      <EstablishmentCardCompact 
                        key={est.id} 
                        id={est.id} 
                        name={est.name} 
                        category={est.category} 
                        profileImage={est.profile_image} 
                        bannerImage={est.banner_image}
                        mainPhotoUrl={mainPhotosMap[est.id]}
                        isPaid={est.is_paid}
                        neighborhood={est.neighborhood}
                        city={est.city}
                        state={est.state}
                        schedule={est.schedule}
                        hasDelivery={est.has_delivery ?? false}
                        ratingAverage={ratingOf(est).average}
                        ratingCount={ratingOf(est).count}
                      />
                    ))}
                  </div>
                  {renderPagination()}
                </>
              )
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
