import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Clock, Tag, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getScheduleStatus } from "@/lib/scheduleUtils";
import { toast } from "sonner";

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
  is_paid: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
}

export default function EstablishmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

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
      setProducts(data);
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

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Conheça ${establishment?.name} no Comércio Vizinho!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Abrindo WhatsApp para compartilhar");
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {establishment.banner_image || establishment.profile_image ? (
            <img
              src={establishment.banner_image || establishment.profile_image}
              alt={establishment.name}
              className="w-full h-64 md:h-96 object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-6xl font-bold text-white">
                {establishment.name.charAt(0).toUpperCase()}
              </span>
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
                  <Button variant="outline" size="icon" onClick={handleShareWhatsApp}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                {establishment.description && (
                  <p className="text-muted-foreground">{establishment.description}</p>
                )}
              </CardContent>
            </Card>

            {products.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Produtos</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 hover:border-primary transition-colors"
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-40 object-cover rounded-md mb-3"
                          />
                        )}
                        <h3 className="font-semibold mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.description}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
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

                {establishment.whatsapp && (
                  <div className="pt-2">
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => {
                        window.open(`https://wa.me/${establishment.whatsapp!.replace(/\D/g, '')}`, '_blank');
                        handlePhoneClick();
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chamar no WhatsApp
                    </Button>
                  </div>
                )}

                {establishment.external_link && (
                  <div className="pt-2">
                    <Button 
                      variant="outline"
                      className="w-full gap-2" 
                      onClick={() => window.open(establishment.external_link!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visitar Site/Instagram
                    </Button>
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    variant="secondary"
                    className="w-full gap-2" 
                    onClick={handleShareWhatsApp}
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar no WhatsApp
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
