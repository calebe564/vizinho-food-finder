import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WhatsAppButton } from "./components/WhatsAppButton";

// Lazy loading para melhor performance
const Home = lazy(() => import("./pages/Home"));
const EstablishmentDetail = lazy(() => import("./pages/EstablishmentDetail"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const Neighborhoods = lazy(() => import("./pages/Neighborhoods"));
const AllEstablishments = lazy(() => import("./pages/AllEstablishments"));
const PublicEstablishmentForm = lazy(() => import("./pages/PublicEstablishmentForm"));
const About = lazy(() => import("./pages/About"));
const ClientInfo = lazy(() => import("./pages/ClientInfo"));
const MerchantInfo = lazy(() => import("./pages/MerchantInfo"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WhatsAppButton />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/estabelecimento/:id" element={<EstablishmentDetail />} />
              <Route path="/categorias" element={<Categories />} />
              <Route path="/bairros" element={<Neighborhoods />} />
              <Route path="/estabelecimentos" element={<AllEstablishments />} />
              <Route path="/cadastrar" element={<PublicEstablishmentForm />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/info-clientes" element={<ClientInfo />} />
              <Route path="/info-comerciantes" element={<MerchantInfo />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
