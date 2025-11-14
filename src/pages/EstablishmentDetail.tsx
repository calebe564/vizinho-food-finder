import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Establishment {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  schedule: string;
  category: string;
  profile_image: string | null;
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
      .single();

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
      .single();

    if (stat) {
      await supabase
        .from("establishment_statistics")
        .update({ phone_clicks: stat.phone_clicks + 1 })
        .eq("establishment_id", id);
    }
  };

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

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
          {establishment.profile_image ? (
            <img
              src={establishment.profile_image}
              alt={establishment.name}
              className="w-full h-64 md:h-96 object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-6xl font-bold text-primary-foreground">
                {establishment.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{establishment.name}</h1>
                  <Badge variant="secondary" className="capitalize">
                    {establishment.category}
                  </Badge>
                  {establishment.is_paid && (
                    <Badge className="ml-2 bg-accent">Patrocinado</Badge>
                  )}
                </div>
              </div>

              {establishment.description && (
                <p className="text-muted-foreground">{establishment.description}</p>
              )}
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-muted-foreground">{establishment.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <a
                      href={`tel:${establishment.phone}`}
                      onClick={handlePhoneClick}
                      className="text-primary hover:underline"
                    >
                      {establishment.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Horário</p>
                    <p className="text-muted-foreground">{establishment.schedule}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Produtos</h2>
                </div>

                {products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum produto cadastrado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="border-b pb-4 last:border-0">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{product.name}</h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {product.description}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-primary ml-2">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
