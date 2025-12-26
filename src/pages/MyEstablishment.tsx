import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEstablishmentRequest } from '@/hooks/useEstablishmentRequest';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { 
  Building2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Loader2,
  Store,
  Phone,
  MapPin,
  Image
} from 'lucide-react';

interface Establishment {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  whatsapp: string | null;
  schedule: string;
  profile_image: string | null;
  category: string;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
}

export default function MyEstablishment() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { role, isEmpresario, isLoading: roleLoading } = useUserRole();
  const { request, hasPendingRequest, hasApprovedRequest, isLoading: requestLoading } = useEstablishmentRequest();
  
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || roleLoading) return;

    const fetchEstablishment = async () => {
      try {
        // Buscar vinculação do usuário com estabelecimento
        const { data: userEstablishment, error: ueError } = await supabase
          .from('user_establishments')
          .select('establishment_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (ueError || !userEstablishment) {
          setLoading(false);
          return;
        }

        // Buscar dados do estabelecimento
        const { data: estData, error: estError } = await supabase
          .from('establishments')
          .select('*')
          .eq('id', userEstablishment.establishment_id)
          .single();

        if (estError) {
          console.error('Error fetching establishment:', estError);
          setLoading(false);
          return;
        }

        setEstablishment(estData);

        // Buscar produtos
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('establishment_id', estData.id)
          .order('name');

        if (!prodError && productsData) {
          setProducts(productsData);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishment();
  }, [user, roleLoading]);

  if (authLoading || roleLoading || requestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { state: { from: '/minha-empresa' } });
    return null;
  }

  // Usuário comum que não tem empresa
  if (role === 'user' && !hasPendingRequest && !hasApprovedRequest) {
    return (
      <>
        <Helmet>
          <title>Minha Empresa | Comércio Vizinho</title>
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container px-4 py-8 flex items-center justify-center">
            <Card className="max-w-md w-full border-0 shadow-elevated rounded-3xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Cadastre sua Empresa</CardTitle>
                <CardDescription className="text-base">
                  Você ainda não tem uma empresa cadastrada. Envie uma solicitação para começar!
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button onClick={() => navigate('/cadastrar')} className="w-full">
                  Cadastrar Empresa
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Voltar para Início
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Usuário tem solicitação pendente
  if (hasPendingRequest && request) {
    return (
      <>
        <Helmet>
          <title>Aguardando Aprovação | Comércio Vizinho</title>
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container px-4 py-8 flex items-center justify-center">
            <Card className="max-w-md w-full border-0 shadow-elevated rounded-3xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10">
                    <Clock className="h-10 w-10 text-amber-500" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Aguardando Aprovação</CardTitle>
                <CardDescription className="text-base">
                  Sua solicitação para "{request.name}" está sendo analisada pela nossa equipe.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enviado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Voltar para Início
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Solicitação rejeitada
  if (request?.status === 'rejected') {
    return (
      <>
        <Helmet>
          <title>Solicitação Recusada | Comércio Vizinho</title>
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container px-4 py-8 flex items-center justify-center">
            <Card className="max-w-md w-full border-0 shadow-elevated rounded-3xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-destructive/10">
                    <XCircle className="h-10 w-10 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Solicitação Recusada</CardTitle>
                <CardDescription className="text-base">
                  Sua solicitação para "{request.name}" foi recusada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.rejection_reason && (
                  <div className="bg-destructive/5 rounded-lg p-4">
                    <p className="text-sm font-medium text-destructive mb-1">Motivo:</p>
                    <p className="text-sm text-muted-foreground">{request.rejection_reason}</p>
                  </div>
                )}
                <Button onClick={() => navigate('/cadastrar')} className="w-full">
                  Enviar Nova Solicitação
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Voltar para Início
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Empresário com estabelecimento aprovado
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <>
        <Helmet>
          <title>Minha Empresa | Comércio Vizinho</title>
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container px-4 py-8 flex items-center justify-center">
            <Card className="max-w-md w-full border-0 shadow-elevated rounded-3xl">
              <CardHeader className="text-center">
                <CardTitle>Empresa não encontrada</CardTitle>
                <CardDescription>
                  Não foi possível encontrar sua empresa. Entre em contato com o suporte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Voltar para Início
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Minha Empresa - {establishment.name} | Comércio Vizinho</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header da empresa */}
            <Card className="mb-6 border-0 shadow-elevated rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="flex items-center gap-4">
                  {establishment.profile_image ? (
                    <img 
                      src={establishment.profile_image} 
                      alt={establishment.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Store className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold">{establishment.name}</h1>
                      <Badge variant={establishment.active ? "default" : "secondary"}>
                        {establishment.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{establishment.category}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">
                  <Building2 className="h-4 w-4 mr-2" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="products">
                  <Package className="h-4 w-4 mr-2" />
                  Produtos ({products.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card className="border-0 shadow-elevated rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Informações da Empresa
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Endereço</Label>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                          <p className="text-sm">{establishment.address}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Telefone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <p className="text-sm">{establishment.phone}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Horário</Label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-sm">{establishment.schedule}</p>
                        </div>
                      </div>
                    </div>
                    {establishment.description && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Descrição</Label>
                        <p className="text-sm">{establishment.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card className="border-0 shadow-elevated rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Produtos
                      <Button size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {products.map(product => (
                          <div key={product.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-primary font-semibold">
                                R$ {product.price.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
