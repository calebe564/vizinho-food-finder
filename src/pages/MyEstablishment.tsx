import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEstablishmentRequest } from '@/hooks/useEstablishmentRequest';
import { useActiveEstablishment } from '@/contexts/ActiveEstablishmentContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EstablishmentSelector } from '@/components/EstablishmentSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { 
  Building2, 
  Package, 
  Clock, 
  XCircle, 
  Edit, 
  Loader2,
  Store,
  Phone,
  MapPin,
  Image,
  Trash2,
  Camera,
  ImagePlus,
  Settings,
  User,
  Star,
  CheckCircle2,
  ArrowLeftRight,
  Megaphone,
  Sparkles,
  BarChart3,
  StickyNote,
  ChevronRight,
  Crown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EstablishmentStatusCard } from '@/components/business/EstablishmentStatusCard';
import { EditEstablishmentDialog } from '@/components/business/EditEstablishmentDialog';
import { ProductFormDialog, type ProductJson } from '@/components/business/ProductFormDialog';
import { BusinessNotesSheet } from '@/components/business/BusinessNotesSheet';
import { ProfileCompletionCard } from '@/components/business/ProfileCompletionCard';
import { InviteAdminDialog } from '@/components/business/InviteAdminDialog';
import { HighlightRequestSection } from '@/components/business/HighlightRequestSection';
import { PromotionManagementSection } from '@/components/business/PromotionManagementSection';
import { useEstablishmentPhotos, useAddPhotos, useSetMainPhoto, useDeletePhoto } from '@/hooks/useEstablishmentPhotos';
import { ReviewSection } from '@/components/ReviewSection';

interface EstablishmentData {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  whatsapp: string | null;
  schedule: string | null;
  profile_image: string | null;
  category: string;
  images: string[];
  products_json: ProductJson[];
  isFromRequest: boolean;
}

export default function MyEstablishment() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { request, hasPendingRequest, hasApprovedRequest, isLoading: requestLoading } = useEstablishmentRequest();
  const { activeEstablishment, establishments, count: estCount, isLoading: estLoading } = useActiveEstablishment();
  
  const [establishmentData, setEstablishmentData] = useState<EstablishmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Photo management hooks (from establishment_photos table)
  const estId = establishmentData?.isFromRequest ? undefined : establishmentData?.id;
  const { data: photos = [], isLoading: photosLoading } = useEstablishmentPhotos(estId);
  const addPhotosMutation = useAddPhotos(estId || '');
  const setMainPhotoMutation = useSetMainPhoto(estId || '');
  const deletePhotoMutation = useDeletePhoto(estId || '');
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductJson | null>(null);
  const [editingProductIndex, setEditingProductIndex] = useState<number | undefined>(undefined);

  const fetchEstablishmentData = async () => {
    if (!user) return;
    
    try {
      // Use active establishment from context if available
      const targetEstId = activeEstablishment?.establishment_id;
      
      if (targetEstId) {
        const { data: estData } = await supabase
          .from('establishments')
          .select('*')
          .eq('id', targetEstId)
          .maybeSingle();

        if (estData) {
          setEstablishmentData({
            id: estData.id,
            name: estData.name,
            description: estData.description,
            address: estData.address,
            phone: estData.phone,
            whatsapp: estData.whatsapp,
            schedule: estData.schedule,
            profile_image: estData.profile_image,
            category: estData.category,
            images: Array.isArray(estData.images) ? estData.images as string[] : [],
            products_json: [],
            isFromRequest: false
          });
          setLoading(false);
          return;
        }
      }

      // Fallback: check user_establishments table directly
      if (!targetEstId) {
        const { data: userEstablishment } = await supabase
          .from('user_establishments')
          .select('establishment_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (userEstablishment?.establishment_id) {
          const { data: estData } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', userEstablishment.establishment_id)
            .maybeSingle();

          if (estData) {
            setEstablishmentData({
              id: estData.id,
              name: estData.name,
              description: estData.description,
              address: estData.address,
              phone: estData.phone,
              whatsapp: estData.whatsapp,
              schedule: estData.schedule,
              profile_image: estData.profile_image,
              category: estData.category,
              images: Array.isArray(estData.images) ? estData.images as string[] : [],
              products_json: [],
              isFromRequest: false
            });
            setLoading(false);
            return;
          }
        }
      }

      // Se não encontrou, buscar da solicitação aprovada mais recente
      const { data: approvedRequest } = await supabase
        .from('establishment_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (approvedRequest) {
        const images = Array.isArray(approvedRequest.images) ? approvedRequest.images as string[] : [];
        const productsJson = Array.isArray(approvedRequest.products_json) 
          ? (approvedRequest.products_json as unknown as ProductJson[])
          : [];

        setEstablishmentData({
          id: approvedRequest.id,
          name: approvedRequest.name,
          description: approvedRequest.description,
          address: approvedRequest.address,
          phone: approvedRequest.phone,
          whatsapp: approvedRequest.whatsapp,
          schedule: approvedRequest.schedule,
          profile_image: approvedRequest.profile_image,
          category: approvedRequest.category,
          images,
          products_json: productsJson,
          isFromRequest: true
        });
      }
    } catch (err) {
      console.error('Error fetching establishment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || roleLoading || requestLoading || estLoading) return;
    setLoading(true);
    fetchEstablishmentData();
  }, [user, roleLoading, requestLoading, estLoading, activeEstablishment?.establishment_id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !establishmentData) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('establishment-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('establishment-images')
        .getPublicUrl(fileName);

      // Atualizar no banco
      if (establishmentData.isFromRequest) {
        const { error } = await supabase
          .from('establishment_requests')
          .update({ profile_image: publicUrl })
          .eq('id', establishmentData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('establishments')
          .update({ profile_image: publicUrl })
          .eq('id', establishmentData.id);
        if (error) throw error;
      }

      setEstablishmentData(prev => prev ? { ...prev, profile_image: publicUrl } : null);
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !estId) return;
    addPhotosMutation.mutate(Array.from(files));
  };


  const handleDeleteProduct = async (index: number) => {
    if (!establishmentData) return;

    try {
      const updatedProducts = [...establishmentData.products_json];
      updatedProducts.splice(index, 1);

      const productsJson = JSON.parse(JSON.stringify(updatedProducts));
      const table = establishmentData.isFromRequest ? 'establishment_requests' : 'establishments';
      
      const { error } = await supabase
        .from(table)
        .update({ products_json: productsJson })
        .eq('id', establishmentData.id);

      if (error) throw error;

      setEstablishmentData(prev => prev ? { ...prev, products_json: updatedProducts } : null);
      toast.success('Produto removido!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao remover produto');
    }
  };

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

  // Usuário comum que não tem empresa - mostrar opções
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
                <CardTitle className="text-2xl font-bold">Sua Empresa</CardTitle>
                <CardDescription className="text-base">
                  Você ainda não tem uma empresa vinculada. Escolha uma opção abaixo:
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="p-4 rounded-xl border bg-muted/50 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Cadastrar Nova Empresa
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sua empresa ainda não está no Comércio Vizinho? Cadastre-a agora!
                  </p>
                  <Button onClick={() => navigate('/cadastrar')} className="w-full mt-2">
                    Cadastrar Empresa
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/50 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Reivindicar Empresa Existente
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sua empresa já está cadastrada? Reivindique a administração usando seu CNPJ.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/reivindicar-empresa')} 
                    className="w-full mt-2"
                  >
                    Reivindicar Empresa
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
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

  if (!establishmentData) {
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

  const products = establishmentData.products_json || [];
  
  // Calculate profile completion
  const hasLogo = !!establishmentData.profile_image;
  const hasDescription = !!establishmentData.description && establishmentData.description.length > 10;
  const hasCategory = !!establishmentData.category;
  const hasPhotos = photos.length > 0;
  const hasSchedule = !!establishmentData.schedule;
  const hasProducts = products.length > 0;
  
  const completedItems = [hasLogo, hasDescription, hasCategory, hasPhotos, hasSchedule, hasProducts].filter(Boolean).length;
  const profilePercentage = Math.round((completedItems / 6) * 100);

  const pageTitle = estCount > 1 ? 'Empresas' : 'Minha Empresa';

  const categoryLabels: Record<string, string> = {
    restaurante: "Restaurante", lanchonete: "Lanchonete", padaria: "Padaria",
    supermercado: "Supermercado", açougue: "Açougue", hortifruti: "Hortifruti",
    pizzaria: "Pizzaria", hamburgueria: "Hamburgueria", bar: "Bar",
    cafe: "Café", outro: "Outro", sorveteria: "Sorveteria", acai: "Açaí", espetinho: "Espetinho",
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle} - {establishmentData.name} | Comércio Vizinho</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* Establishment Selector (when user has 2+ businesses) */}
            {estCount > 1 && (
              <Card className="border border-border rounded-2xl bg-card">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Empresa Atual:</span>
                  </div>
                  <EstablishmentSelector />
                </CardContent>
              </Card>
            )}
            
            {/* ===== PREMIUM HERO HEADER ===== */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 md:p-8">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              
              <div className="relative flex items-center gap-5">
                {/* Clickable Logo */}
                <div className="relative group flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-primary-foreground/20 shadow-lg">
                    {establishmentData.profile_image ? (
                      <img 
                        src={establishmentData.profile_image} 
                        alt={establishmentData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-foreground/10 flex items-center justify-center">
                        <Store className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground/60" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-5 w-5 text-white" />
                        <span className="text-[10px] text-white font-medium">Trocar</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-primary-foreground truncate">
                    {establishmentData.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
                      {categoryLabels[establishmentData.category] || establishmentData.category}
                    </Badge>
                    <Badge className="bg-green-500/90 text-white border-0 text-xs">
                      ● Ativo
                    </Badge>
                  </div>
                  <p className="text-primary-foreground/60 text-xs mt-2 hidden md:block">
                    Clique na logo para alterar a imagem
                  </p>
                </div>
              </div>
            </div>

            {/* Status + Profile Completion */}
            <EstablishmentStatusCard 
              isActive={true}
              profileComplete={profilePercentage}
            />

            <ProfileCompletionCard
              hasLogo={hasLogo}
              hasDescription={hasDescription}
              hasCategory={hasCategory}
              hasPhotos={hasPhotos}
              hasSchedule={hasSchedule}
              hasProducts={hasProducts}
            />

            {/* ===== MAIN TABS ===== */}
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6 h-12 rounded-2xl bg-muted/80 p-1">
                <TabsTrigger value="info" className="rounded-xl text-xs md:text-sm data-[state=active]:shadow-md gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden md:inline">Info</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="rounded-xl text-xs md:text-sm data-[state=active]:shadow-md gap-1.5">
                  <Package className="h-4 w-4" />
                  <span className="hidden md:inline">Produtos</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl text-xs md:text-sm data-[state=active]:shadow-md gap-1.5">
                  <Star className="h-4 w-4" />
                  <span className="hidden md:inline">Avaliações</span>
                </TabsTrigger>
                <TabsTrigger value="functions" className="rounded-xl text-xs md:text-sm data-[state=active]:shadow-md gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden md:inline">Funções</span>
                </TabsTrigger>
                <TabsTrigger value="photos" className="rounded-xl text-xs md:text-sm data-[state=active]:shadow-md gap-1.5">
                  <Image className="h-4 w-4" />
                  <span className="hidden md:inline">Fotos</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl text-xs md:text-sm data-[state=active]:shadow-md gap-1.5">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Config</span>
                </TabsTrigger>
              </TabsList>

              {/* ===== TAB: INFORMAÇÕES ===== */}
              <TabsContent value="info">
                <Card className="border border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Informações da Empresa
                      </span>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium uppercase tracking-wider">Endereço</span>
                        </div>
                        <p className="text-sm font-medium">{establishmentData.address}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium uppercase tracking-wider">Telefone</span>
                        </div>
                        <p className="text-sm font-medium">{establishmentData.phone}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium uppercase tracking-wider">Horário</span>
                        </div>
                        <p className="text-sm font-medium">{establishmentData.schedule || 'Não informado'}</p>
                      </div>
                      {establishmentData.whatsapp && (
                        <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wider">WhatsApp</span>
                          </div>
                          <p className="text-sm font-medium">{establishmentData.whatsapp}</p>
                        </div>
                      )}
                    </div>
                    {establishmentData.description && (
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descrição</span>
                        <p className="text-sm leading-relaxed">{establishmentData.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== TAB: PRODUTOS ===== */}
              <TabsContent value="products">
                <Card className="border border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Produtos
                        {products.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{products.length}</Badge>
                        )}
                      </span>
                      <Button size="sm" className="rounded-xl" onClick={() => {
                        setEditingProduct(null);
                        setEditingProductIndex(undefined);
                        setProductDialogOpen(true);
                      }}>
                        <Package className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-foreground">Nenhum produto cadastrado</p>
                        <p className="text-sm text-muted-foreground mt-1">Adicione seus produtos para atrair clientes</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {products.map((product, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-colors">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-14 h-14 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center border border-border">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{product.name}</p>
                              {product.hasVariations && product.variations ? (
                                <p className="text-primary text-xs font-medium">
                                  {product.variations.length} variações
                                </p>
                              ) : (
                                <p className="text-primary font-bold text-sm">
                                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setEditingProductIndex(index);
                                  setProductDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                                onClick={() => handleDeleteProduct(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== TAB: AVALIAÇÕES ===== */}
              <TabsContent value="reviews">
                {!establishmentData.isFromRequest ? (
                  <ReviewSection 
                    establishmentId={establishmentData.id}
                    ratingAverage={(activeEstablishment as any)?.rating_average || 0}
                    ratingCount={(activeEstablishment as any)?.rating_count || 0}
                    isOwnerView={true}
                  />
                ) : (
                  <Card className="border border-border rounded-2xl">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium">Avaliações disponíveis após aprovação</p>
                      <p className="text-sm text-muted-foreground mt-1">Seus clientes poderão avaliar sua empresa</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ===== TAB: FUNÇÕES ===== */}
              <TabsContent value="functions">
                {establishmentData.isFromRequest ? (
                  <Card className="border border-border rounded-2xl">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium">Funções disponíveis após aprovação</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quando sua empresa for aprovada, você poderá usar todas as funções.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Function Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Promoções */}
                      <Card className="border border-border rounded-2xl hover:border-primary/30 transition-colors group">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <Megaphone className="h-6 w-6 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground">Criar Promoção</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Crie promoções para atrair mais clientes e aumentar sua visibilidade nos resultados.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Destaques */}
                      <Card className="border border-border rounded-2xl hover:border-primary/30 transition-colors group">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <Crown className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground">Solicitar Destaque</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Apareça no slider principal da página inicial e ganhe mais visibilidade.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Estatísticas */}
                      <Card className="border border-border rounded-2xl hover:border-primary/30 transition-colors group">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <BarChart3 className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground">Estatísticas</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Acompanhe visualizações, cliques e desempenho da sua empresa.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Notas Internas */}
                      <BusinessNotesSheet establishmentId={establishmentData.id} />
                    </div>

                    {/* Expanded sections */}
                    <div className="space-y-4">
                      <HighlightRequestSection establishmentId={establishmentData.id} />
                      <PromotionManagementSection establishmentId={establishmentData.id} />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ===== TAB: FOTOS ===== */}
              <TabsContent value="photos">
                <Card className="border border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Image className="h-5 w-5 text-primary" />
                        Fotos do Estabelecimento
                        {photos.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{photos.length}</Badge>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotosUpload}
                          className="hidden"
                          id="photos-upload"
                          disabled={addPhotosMutation.isPending}
                        />
                        <label htmlFor="photos-upload">
                          <Button asChild size="sm" className="rounded-xl" disabled={addPhotosMutation.isPending}>
                            <span>
                              {addPhotosMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ImagePlus className="h-4 w-4 mr-2" />
                              )}
                              Adicionar
                            </span>
                          </Button>
                        </label>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      💡 Clique em "Definir Principal" para escolher a foto oficial da empresa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!estId ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Sistema de fotos disponível após aprovação</p>
                      </div>
                    ) : photos.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Nenhuma foto cadastrada</p>
                        <p className="text-sm text-muted-foreground mt-1">Fotos de qualidade aumentam o interesse dos clientes</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                            <img 
                              src={photo.url} 
                              alt="Foto do estabelecimento"
                              className={`w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform ${photo.is_main ? 'ring-2 ring-primary' : ''}`}
                              onClick={() => {
                                setSelectedPhoto(photo.url);
                                setPhotoDialogOpen(true);
                              }}
                            />
                            {photo.is_main && (
                              <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Principal
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between">
                              {!photo.is_main && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-[10px] px-2 rounded-lg"
                                  onClick={(e) => { e.stopPropagation(); setMainPhotoMutation.mutate(photo.id); }}
                                  disabled={setMainPhotoMutation.isPending}
                                >
                                  Definir Principal
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-7 w-7 ml-auto rounded-lg"
                                onClick={(e) => { e.stopPropagation(); deletePhotoMutation.mutate({ photoId: photo.id, wasMain: photo.is_main }); }}
                                disabled={deletePhotoMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== TAB: CONFIGURAÇÕES ===== */}
              <TabsContent value="settings">
                <Card className="border border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Perfil do Empresário
                    </CardTitle>
                    <CardDescription>
                      Informações do responsável pela empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</span>
                        <p className="text-sm font-medium">{user?.email}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo de conta</span>
                        <Badge variant="outline" className="mt-1">Empresário</Badge>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Para alterar informações de acesso, entre em contato com o suporte.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>

      {/* Dialog para visualizar foto em tamanho grande */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizar foto</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <img 
              src={selectedPhoto} 
              alt="Foto ampliada"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar informações */}
      <EditEstablishmentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        establishmentId={establishmentData.id}
        isFromRequest={establishmentData.isFromRequest}
        initialData={{
          name: establishmentData.name,
          description: establishmentData.description,
          category: establishmentData.category,
          phone: establishmentData.phone,
          whatsapp: establishmentData.whatsapp,
          schedule: establishmentData.schedule,
          address: establishmentData.address,
        }}
        onSuccess={fetchEstablishmentData}
      />

      {/* Dialog para adicionar/editar produto */}
      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        establishmentId={establishmentData.id}
        isFromRequest={establishmentData.isFromRequest}
        existingProducts={products}
        editingProduct={editingProduct}
        editingIndex={editingProductIndex}
        onSuccess={(updatedProducts) => {
          setEstablishmentData(prev => prev ? { ...prev, products_json: updatedProducts } : null);
        }}
      />
    </>
  );
}
