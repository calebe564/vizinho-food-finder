import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AIChatButton } from "./components/AIChatButton";

// Lazy loading para melhor performance
const Home = lazy(() => import("./pages/Home"));
const EstablishmentDetail = lazy(() => import("./pages/EstablishmentDetail"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const AllEstablishments = lazy(() => import("./pages/AllEstablishments"));
const PublicEstablishmentForm = lazy(() => import("./pages/PublicEstablishmentForm"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Information = lazy(() => import("./pages/Information"));
const About = lazy(() => import("./pages/About"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

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
            <AdminProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <LocationProvider>
                    <AIChatButton />
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/estabelecimento/:id" element={<EstablishmentDetail />} />
                        <Route path="/produto/:id" element={<ProductDetail />} />
                        <Route path="/categorias" element={<Categories />} />
                        <Route path="/estabelecimentos" element={<AllEstablishments />} />
                        <Route path="/favoritos" element={<Favorites />} />
                        <Route path="/cadastrar" element={<PublicEstablishmentForm />} />
                        <Route path="/informacoes" element={<Information />} />
                        <Route path="/sobre" element={<About />} />
                        <Route path="/termos-de-uso" element={<TermsOfUse />} />
                        <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/dashboard/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </LocationProvider>
                </BrowserRouter>
              </TooltipProvider>
            </AdminProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </React.Fragment>
  );
}

export default App;
