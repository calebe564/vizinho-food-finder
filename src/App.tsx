import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "./pages/Home";
import EstablishmentDetail from "./pages/EstablishmentDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Categories from "./pages/Categories";
import Neighborhoods from "./pages/Neighborhoods";
import AllEstablishments from "./pages/AllEstablishments";
import PublicEstablishmentForm from "./pages/PublicEstablishmentForm";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WhatsAppButton } from "./components/WhatsAppButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WhatsAppButton />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/estabelecimento/:id" element={<EstablishmentDetail />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/bairros" element={<Neighborhoods />} />
            <Route path="/estabelecimentos" element={<AllEstablishments />} />
            <Route path="/cadastrar" element={<PublicEstablishmentForm />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
