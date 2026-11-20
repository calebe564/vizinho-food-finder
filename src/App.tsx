import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveEstablishmentProvider } from "@/contexts/ActiveEstablishmentContext";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { AreaRoute } from "./components/AreaRoute";
// AI Chat button removed - now integrated into Header menu
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRealtimeInvalidation } from "./hooks/useRealtimeInvalidation";

// Component to mount realtime listeners inside QueryClientProvider
function RealtimeSync() {
  useRealtimeInvalidation();
  return null;
}

// Lazy loading para melhor performance
const Home = lazy(() => import("./pages/Home"));
const EstablishmentDetail = lazy(() => import("./pages/EstablishmentDetail"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const Compass = lazy(() => import("./pages/Compass"));
const AllEstablishments = lazy(() => import("./pages/AllEstablishments"));
const PublicEstablishmentForm = lazy(() => import("./pages/PublicEstablishmentForm"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Information = lazy(() => import("./pages/Information"));
const About = lazy(() => import("./pages/About"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ProhibitedProducts = lazy(() => import("./pages/ProhibitedProducts"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const MyEstablishment = lazy(() => import("./pages/MyEstablishment"));
const ClaimEstablishment = lazy(() => import("./pages/ClaimEstablishment"));
const UserConversations = lazy(() => import("./pages/UserConversations"));
const UserChat = lazy(() => import("./pages/UserChat"));
const Plans = lazy(() => import("./pages/Plans"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Create QueryClient outside the component to avoid recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <React.Fragment>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AdminProvider>
                <ActiveEstablishmentProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <RealtimeSync />
                    <BrowserRouter>
                      <LocationProvider>
                        {/* AI Chat Button moved to Header menu */}
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/auth" element={<Auth />} />
                              <Route path="/estabelecimento/:id" element={<EstablishmentDetail />} />
                              <Route path="/produto/:id" element={<ProductDetail />} />
                              <Route path="/categorias" element={<Categories />} />
                              <Route path="/buscar" element={<Compass />} />
                              <Route path="/estabelecimentos" element={<AllEstablishments />} />
                              <Route path="/favoritos" element={<Favorites />} />
                              {/* Área do comerciante (separada do site do consumidor) */}
                              <Route path="/painel" element={<Navigate to="/painel/empresa" replace />} />
                              <Route path="/painel/empresa" element={<AreaRoute area="comerciante"><MyEstablishment /></AreaRoute>} />
                              <Route path="/painel/planos" element={<AreaRoute area="comerciante"><Plans /></AreaRoute>} />
                              <Route path="/minha-empresa" element={<Navigate to="/painel/empresa" replace />} />
                              <Route path="/reivindicar-empresa" element={<ClaimEstablishment />} />
                              <Route path="/suporte" element={<UserConversations />} />
                              <Route path="/suporte/:id" element={<UserChat />} />
                              <Route path="/cadastrar" element={<PublicEstablishmentForm />} />
                              <Route path="/planos" element={<Plans />} />
                              <Route path="/informacoes" element={<Information />} />
                              <Route path="/sobre" element={<About />} />
                              <Route path="/termos-de-uso" element={<TermsOfUse />} />
                              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                              <Route path="/politica-de-produtos-proibidos" element={<ProhibitedProducts />} />
                              <Route path="/admin/login" element={<AdminLogin />} />
                              <Route path="/admin/dashboard/*" element={<AreaRoute area="admin"><AdminDashboard /></AreaRoute>} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </LocationProvider>
                    </BrowserRouter>
                  </TooltipProvider>
                </ActiveEstablishmentProvider>
              </AdminProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </React.Fragment>
  );
}

export default App;