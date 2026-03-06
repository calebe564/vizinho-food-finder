import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Building2, Upload, CheckCircle, Plus, Trash2, Star, MapPin, Phone, Package, Image, Loader2, Truck } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { CadastroAIHelper } from "@/components/CadastroAIHelper";
import { DocumentInput, type DocumentLookupResult, type CPFFormData } from "@/components/DocumentInput";
import { validateDocument, validateAge, type DocumentType } from "@/lib/validationUtils";
import { useOwnershipCheck } from "@/hooks/useOwnershipCheck";
import { OwnershipBlockDialog } from "@/components/OwnershipBlockDialog";

type EstablishmentCategory = Database["public"]["Enums"]["establishment_category"];

const categories: EstablishmentCategory[] = [
  "restaurante",
  "lanchonete",
  "padaria",
  "supermercado",
  "açougue",
  "hortifruti",
  "pizzaria",
  "hamburgueria",
  "bar",
  "cafe",
  "outro"
];

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
  outro: "Outro"
};

interface ProductVariation {
  id: string;
  name: string;
  price: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  hasVariations: boolean;
  variations: ProductVariation[];
  image: File | null;
  imagePreview: string | null;
}

interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  numero: string;
  complemento: string;
}

export default function PublicEstablishmentForm() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmMaster, isAdmin, isLoading: roleLoading } = useUserRole();
  const { isBlocked, blockReason, isLoading: ownershipLoading } = useOwnershipCheck();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [document, setDocument] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>('unknown');
  const [documentLookupResult, setDocumentLookupResult] = useState<DocumentLookupResult | null>(null);
  const [cpfFormData, setCpfFormData] = useState<CPFFormData>({
    nomeCompleto: '',
    dataNascimento: '',
    endereco: '',
    telefone: '',
    categoria: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [favoriteIndexes, setFavoriteIndexes] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    schedule: "",
    description: "",
    external_link: "",
    logo: null as File | null
  });

  const [addressData, setAddressData] = useState<AddressData>({
    cep: "",
    logradouro: "",
    bairro: "",
    localidade: "",
    uf: "",
    ibge: "",
    numero: "",
    complemento: ""
  });
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  const [contactData, setContactData] = useState({
    whatsapp: "",
    website: ""
  });

  const [deliveryData, setDeliveryData] = useState({
    hasDelivery: false,
    deliveryType: "" as "proprio" | "ifood" | "uber_eats" | "outro" | "",
    deliveryOther: ""
  });
  
  const [products, setProducts] = useState<Product[]>([
    { id: crypto.randomUUID(), name: "", price: "", hasVariations: false, variations: [], image: null, imagePreview: null }
  ]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Show auth dialog if user is not logged in
  if (!authLoading && !user) {
    return (
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
              <CardTitle className="text-2xl font-bold">Login Necessário</CardTitle>
              <CardDescription className="text-base">
                Você precisa estar logado para cadastrar uma empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => navigate('/auth', { state: { from: '/cadastrar' } })} className="w-full">
                Criar conta ou Entrar
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Voltar para Início
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <AuthRequiredDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog}
          redirectPath="/cadastrar"
        />
      </div>
    );
  }

  // CEP Lookup via ViaCEP
  const handleCepBlur = async () => {
    const cep = addressData.cep.replace(/\D/g, "");
    
    if (cep.length !== 8) {
      return;
    }

    setLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado ou inválido");
        return;
      }

      setAddressData(prev => ({
        ...prev,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        localidade: data.localidade || "",
        uf: data.uf || "",
        ibge: data.ibge || ""
      }));
      
      setAddressConfirmed(false); // Reset confirmation when CEP changes

      toast.success("Endereço encontrado! Confirme os dados abaixo.");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFavoriteIndexes(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const toggleFavorite = (index: number) => {
    if (favoriteIndexes.includes(index)) {
      setFavoriteIndexes(prev => prev.filter(i => i !== index));
    } else if (favoriteIndexes.length < 4) {
      setFavoriteIndexes(prev => [...prev, index]);
    } else {
      toast.error("Máximo de 4 imagens favoritas permitidas");
    }
  };

  const addProduct = () => {
    setProducts(prev => [...prev, { 
      id: crypto.randomUUID(), 
      name: "", 
      price: "", 
      hasVariations: false,
      variations: [],
      image: null,
      imagePreview: null
    }]);
  };

  const removeProduct = (productId: string) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const updateProduct = (productId: string, field: keyof Product, value: string | boolean) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const toggleProductVariations = (productId: string, hasVariations: boolean) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        if (hasVariations) {
          // Add first variation when enabling
          return { 
            ...p, 
            hasVariations: true, 
            price: "",
            variations: [{ id: crypto.randomUUID(), name: "", price: "" }] 
          };
        } else {
          // Remove all variations when disabling
          return { ...p, hasVariations: false, variations: [] };
        }
      }
      return p;
    }));
  };

  const addVariation = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, variations: [...p.variations, { id: crypto.randomUUID(), name: "", price: "" }] }
        : p
    ));
  };

  const removeVariation = (productId: string, variationId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, variations: p.variations.filter(v => v.id !== variationId) }
        : p
    ));
  };

  const updateVariation = (productId: string, variationId: string, field: "name" | "price", value: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            variations: p.variations.map(v => 
              v.id === variationId ? { ...v, [field]: value } : v
            )
          }
        : p
    ));
  };

  const handleProductImageChange = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, image: file, imagePreview: reader.result as string } : p
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProductImage = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, image: null, imagePreview: null } : p
    ));
  };

  const validateProducts = (): boolean => {
    for (const product of products) {
      if (!product.name.trim()) {
        toast.error("Todos os produtos devem ter um nome");
        return false;
      }
      
      // Check product image is required
      if (!product.image) {
        toast.error(`O produto "${product.name || 'sem nome'}" precisa ter uma imagem`);
        return false;
      }
      
      if (product.hasVariations) {
        // Product with variations - check variations have name and price
        if (product.variations.length === 0) {
          toast.error(`O produto "${product.name}" precisa ter pelo menos uma variação`);
          return false;
        }
        for (const variation of product.variations) {
          if (!variation.name.trim()) {
            toast.error(`Todas as variações do produto "${product.name}" precisam ter um nome`);
            return false;
          }
          if (!variation.price.trim() || isNaN(parseFloat(variation.price))) {
            toast.error(`A variação "${variation.name}" precisa ter um preço válido`);
            return false;
          }
        }
      } else {
        // Product without variations - must have price
        if (!product.price.trim() || isNaN(parseFloat(product.price))) {
          toast.error(`O produto "${product.name}" precisa ter um preço válido`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block if user already has an establishment
    if (isBlocked && !isAdmMaster && !isAdmin) {
      setShowBlockDialog(true);
      return;
    }
    
    // Check if document is required (only for regular users)
    const documentRequired = !isAdmMaster && !isAdmin;
    const cleanDocument = document.replace(/\D/g, '');
    
    if (documentRequired) {
      if (!cleanDocument) {
        toast.error("Documento (CNPJ ou CPF) é obrigatório para cadastrar uma empresa");
        return;
      }
      
      const validation = validateDocument(cleanDocument);
      if (!validation.isValid) {
        toast.error("Documento inválido. Verifique o número digitado.");
        return;
      }
      
      // If CPF, validate additional required fields
      if (validation.type === 'cpf') {
        if (!cpfFormData.nomeCompleto.trim()) {
          toast.error("Nome completo é obrigatório para CPF");
          return;
        }
        if (!cpfFormData.dataNascimento) {
          toast.error("Data de nascimento é obrigatória para CPF");
          return;
        }
        if (!validateAge(cpfFormData.dataNascimento)) {
          toast.error("Você deve ter pelo menos 18 anos para cadastrar uma empresa");
          return;
        }
        if (!documentLookupResult?.cpfValidated) {
          toast.error("Valide os dados do CPF antes de continuar");
          return;
        }
      }
    }
    
    // Validate basic info
    if (!formData.name || !formData.category || !formData.schedule) {
      toast.error("Preencha todos os campos obrigatórios da empresa");
      return;
    }

    // Validate address
    if (!addressData.cep || !addressData.logradouro || !addressData.bairro || 
        !addressData.localidade || !addressData.uf || !addressData.numero) {
      toast.error("Preencha todos os campos obrigatórios do endereço");
      return;
    }

    // Validate address confirmation
    if (!addressConfirmed) {
      toast.error("Por favor, confirme o endereço detectado pelo CEP antes de continuar");
      return;
    }

    // Validate contact
    const whatsappClean = contactData.whatsapp.replace(/\D/g, "");
    if (whatsappClean.length < 10) {
      toast.error("Número de WhatsApp inválido. Use o formato: DDD + número");
      return;
    }

    // Validate logo
    if (!formData.logo) {
      toast.error("Envie a logo da empresa");
      return;
    }

    // Validate images
    if (images.length === 0) {
      toast.error("Envie pelo menos uma imagem da empresa");
      return;
    }

    // Validate products
    if (products.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    if (!validateProducts()) {
      return;
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      toast.error("Você precisa aceitar os Termos e Responsabilidades para continuar");
      return;
    }

    try {
      const fullAddress = `${addressData.logradouro}, ${addressData.numero}${addressData.complemento ? ` - ${addressData.complemento}` : ""}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}, CEP: ${addressData.cep}`;

      // Upload logo
      let logoUrl = "";
      if (formData.logo) {
        const logoExt = formData.logo.name.split(".").pop();
        const logoFileName = `${crypto.randomUUID()}.${logoExt}`;
        const logoPath = `requests/logos/${logoFileName}`;

        const { error: logoUploadError } = await supabase.storage
          .from("establishment-images")
          .upload(logoPath, formData.logo);

        if (!logoUploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("establishment-images")
            .getPublicUrl(logoPath);
          logoUrl = publicUrl;
        }
      }

      // Upload images to storage
      const uploadedImages: string[] = [];
      for (const file of images) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `requests/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("establishment-images")
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("establishment-images")
            .getPublicUrl(filePath);
          uploadedImages.push(publicUrl);
        }
      }

      // Get favorite images
      const favoriteImages = favoriteIndexes.map(i => uploadedImages[i]).filter(Boolean);

      // Upload product images and prepare products JSON
      const productsJson = [];
      for (const p of products.filter(p => p.name.trim())) {
        let productImageUrl = "";
        if (p.image) {
          const fileExt = p.image.name.split(".").pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `requests/products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("establishment-images")
            .upload(filePath, p.image);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("establishment-images")
              .getPublicUrl(filePath);
            productImageUrl = publicUrl;
          }
        }

        productsJson.push({
          name: p.name,
          price: p.hasVariations ? 0 : parseFloat(p.price),
          image: productImageUrl,
          hasVariations: p.hasVariations,
          variations: p.variations
            .filter(v => v.name.trim() && v.price.trim())
            .map(v => ({
              name: v.name,
              price: parseFloat(v.price)
            }))
        });
      }

      const { error } = await supabase
        .from("establishment_requests")
        .insert([{
          name: formData.name,
          category: formData.category as EstablishmentCategory,
          neighborhood: addressData.bairro,
          region: null,
          address: fullAddress,
          phone: contactData.whatsapp,
          whatsapp: contactData.whatsapp,
          description: formData.description || null,
          external_link: contactData.website || formData.external_link || null,
          schedule: formData.schedule,
          products_json: productsJson,
          images: uploadedImages,
          favorite_images: favoriteImages,
          profile_image: logoUrl || null,
          user_id: user?.id || null,
          cnpj: documentType === 'cnpj' ? cleanDocument : null,
          cpf_hash: documentType === 'cpf' ? cleanDocument : null,
          document_type: documentType !== 'unknown' ? documentType : 'cnpj',
          birth_date: documentType === 'cpf' && cpfFormData.dataNascimento ? cpfFormData.dataNascimento : null,
          data_origin: documentLookupResult?.razaoSocial ? 'api' : 'manual',
          cep: addressData.cep.replace(/\D/g, "") || null,
          state: addressData.uf || null,
          has_delivery: deliveryData.hasDelivery,
          delivery_type: deliveryData.hasDelivery ? deliveryData.deliveryType || null : null,
           delivery_other: deliveryData.hasDelivery && deliveryData.deliveryType === "outro" ? deliveryData.deliveryOther || null : null,
           terms_accepted_at: new Date().toISOString(),
           terms_version: '1.0'
         }]);

      if (error) throw error;

      toast.success("Solicitação enviada com sucesso! Aguarde a aprovação do administrador.");
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Error submitting request:", error);
      toast.error("Erro ao enviar solicitação: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <Card className="max-w-3xl mx-auto border-0 shadow-elevated rounded-3xl animate-fade-in">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Cadastrar Empresa</CardTitle>
            <CardDescription className="text-base">
              Preencha todos os campos. Após aprovação, sua empresa aparecerá no catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Assistente IA */}
            <div className="mb-6">
              <CadastroAIHelper
                companyName={formData.name}
                category={formData.category ? categoryLabels[formData.category] : undefined}
                onApplySchedule={(schedule) => handleChange("schedule", schedule)}
                onApplyDescription={(description) => handleChange("description", description)}
                onApplyProducts={(aiProducts) => {
                  const newProducts = aiProducts.map(p => ({
                    id: crypto.randomUUID(),
                    name: p.name,
                    price: p.price,
                    hasVariations: false,
                    variations: [],
                    image: null,
                    imagePreview: null
                  }));
                  setProducts(prev => {
                    // Se só tem um produto vazio, substitui
                    if (prev.length === 1 && !prev[0].name.trim()) {
                      return newProducts;
                    }
                    // Caso contrário, adiciona
                    return [...prev, ...newProducts];
                  });
                }}
              />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* ========== SEÇÃO 1: DADOS DA EMPRESA ========== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados da Empresa</h3>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo" className="text-base font-medium">Logo da Empresa *</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="logo"
                        className="flex items-center justify-center w-28 h-28 border-2 border-dashed border-muted-foreground/30 rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                      >
                        {logoPreview ? (
                          <div className="relative w-full h-full">
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <CheckCircle className="h-8 w-8 text-primary-foreground" />
                            </div>
                          </div>
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Clique para enviar a logo da sua empresa
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos: JPG, PNG. Tamanho recomendado: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Ex: Padaria do João"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base font-medium">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-popover">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="rounded-lg">
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Document Field (CNPJ or CPF) */}
                <DocumentInput 
                  value={document}
                  onChange={setDocument}
                  required={!isAdmMaster && !isAdmin}
                  label={isAdmMaster || isAdmin ? "Documento (opcional para administradores)" : "Documento (CNPJ ou CPF)"}
                  autoLookup={true}
                  showCPFFields={true}
                  cpfData={cpfFormData}
                  onCPFDataChange={setCpfFormData}
                  onDocumentTypeChange={setDocumentType}
                  onLookupSuccess={(data) => {
                    setDocumentLookupResult(data);
                    // Para CNPJ, preencher dados automaticamente
                    if (data.documentType === 'cnpj') {
                      // Preencher nome da empresa se vazio
                      if (!formData.name && (data.nomeFantasia || data.razaoSocial)) {
                        handleChange("name", data.nomeFantasia || data.razaoSocial);
                      }
                      // Preencher endereço se houver CEP
                      if (data.cep && !addressData.cep) {
                        setAddressData(prev => ({
                          ...prev,
                          cep: data.cep || '',
                          logradouro: data.logradouro || prev.logradouro,
                          bairro: data.bairro || prev.bairro,
                          localidade: data.municipio || prev.localidade,
                          uf: data.uf || prev.uf,
                        }));
                      }
                      // Preencher WhatsApp se vazio
                      if (data.telefone && !contactData.whatsapp) {
                        setContactData(prev => ({ ...prev, whatsapp: data.telefone || '' }));
                      }
                    }
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor="schedule" className="text-base font-medium">Horário de Funcionamento *</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => handleChange("schedule", e.target.value)}
                    placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 08:00-12:00"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Conte um pouco sobre sua empresa..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* ========== SEÇÃO 2: ENDEREÇO ========== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Endereço</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-base font-medium">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        value={addressData.cep}
                        onChange={(e) => setAddressData(prev => ({ ...prev, cep: e.target.value }))}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="h-12 rounded-xl"
                        maxLength={9}
                        required
                      />
                      {loadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite o CEP para preencher automaticamente
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="logradouro" className="text-base font-medium">Rua *</Label>
                    <Input
                      id="logradouro"
                      value={addressData.logradouro}
                      className="h-12 rounded-xl bg-muted"
                      placeholder="Preenchido automaticamente"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-base font-medium">Número *</Label>
                    <Input
                      id="numero"
                      value={addressData.numero}
                      onChange={(e) => setAddressData(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="123"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="complemento" className="text-base font-medium">Complemento</Label>
                    <Input
                      id="complemento"
                      value={addressData.complemento}
                      onChange={(e) => setAddressData(prev => ({ ...prev, complemento: e.target.value }))}
                      placeholder="Sala 1, Bloco A, etc."
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-base font-medium">Bairro *</Label>
                    <Input
                      id="bairro"
                      value={addressData.bairro}
                      className="h-12 rounded-xl bg-muted"
                      placeholder="Preenchido automaticamente"
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localidade" className="text-base font-medium">Cidade *</Label>
                    <Input
                      id="localidade"
                      value={addressData.localidade}
                      className="h-12 rounded-xl bg-muted"
                      placeholder="Preenchido automaticamente"
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uf" className="text-base font-medium">Estado *</Label>
                    <Input
                      id="uf"
                      value={addressData.uf}
                      className="h-12 rounded-xl bg-muted"
                      placeholder="UF"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Address Confirmation Card */}
                {addressData.logradouro && addressData.bairro && addressData.localidade && (
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    addressConfirmed 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-amber-500 bg-amber-500/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        addressConfirmed ? 'bg-green-500/20' : 'bg-amber-500/20'
                      }`}>
                        {addressConfirmed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <MapPin className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          addressConfirmed ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {addressConfirmed ? '✓ Endereço Confirmado' : 'Confirme o endereço'}
                        </h4>
                        <p className="text-sm text-foreground mt-1">
                          {addressData.logradouro}
                          {addressData.numero && `, ${addressData.numero}`}
                          {addressData.complemento && ` - ${addressData.complemento}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addressData.bairro} · {addressData.localidade} – {addressData.uf}
                        </p>
                        
                        {!addressConfirmed && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2 border-amber-500 text-amber-700 hover:bg-amber-500/20"
                            onClick={() => setAddressConfirmed(true)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar Endereço
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========== SEÇÃO 3: CONTATO ========== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Phone className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contato</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-base font-medium">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(31) 99999-9999"
                      value={contactData.whatsapp}
                      onChange={(e) => setContactData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="h-12 rounded-xl"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Este número será usado para contato direto com clientes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-base font-medium">Site / Instagram (opcional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={contactData.website}
                      onChange={(e) => setContactData(prev => ({ ...prev, website: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* ========== SEÇÃO: DELIVERY ========== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Delivery</h3>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Possui delivery?</Label>
                    <p className="text-sm text-muted-foreground">Marque se oferece entrega</p>
                  </div>
                  <Switch
                    checked={deliveryData.hasDelivery}
                    onCheckedChange={(checked) => setDeliveryData(prev => ({ ...prev, hasDelivery: checked }))}
                  />
                </div>

                {deliveryData.hasDelivery && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Tipo de Delivery</Label>
                      <Select 
                        value={deliveryData.deliveryType} 
                        onValueChange={(v) => setDeliveryData(prev => ({ ...prev, deliveryType: v as typeof prev.deliveryType }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-popover">
                          <SelectItem value="proprio">Delivery Próprio</SelectItem>
                          <SelectItem value="ifood">iFood</SelectItem>
                          <SelectItem value="uber_eats">Uber Eats</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {deliveryData.deliveryType === "outro" && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Descreva</Label>
                        <Input
                          value={deliveryData.deliveryOther}
                          onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryOther: e.target.value }))}
                          placeholder="Ex: Rappi, 99Food, etc."
                          className="h-12 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ========== SEÇÃO 4: PRODUTOS ========== */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Produtos Oferecidos</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addProduct} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>

                <div className="space-y-4">
                  {products.map((product, index) => (
                    <Card key={product.id} className="p-4 bg-secondary/30 rounded-2xl border-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Produto {index + 1}</span>
                          {products.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Nome do Produto *</Label>
                          <Input
                            placeholder="Ex: Pizza, Pão Francês, Hambúrguer"
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                            className="h-11 rounded-xl"
                          />
                        </div>

                        {/* Product Image Upload */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Imagem do Produto *</Label>
                          <div className="flex items-center gap-3">
                            {product.imagePreview ? (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary">
                                <img src={product.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeProductImage(product.id)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor={`product-image-${product.id}`}
                                className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                              >
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">Foto</span>
                              </label>
                            )}
                            <input
                              id={`product-image-${product.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleProductImageChange(product.id, e)}
                              className="sr-only"
                            />
                            <p className="text-xs text-muted-foreground flex-1">
                              Envie uma foto do produto
                            </p>
                          </div>
                        </div>

                        {/* Toggle for variations */}
                        <div className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-xl">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Este produto possui variações?</Label>
                            <p className="text-xs text-muted-foreground">
                              Ex: tamanhos diferentes, sabores, opções
                            </p>
                          </div>
                          <Switch
                            checked={product.hasVariations}
                            onCheckedChange={(checked) => toggleProductVariations(product.id, checked)}
                          />
                        </div>

                        {/* Price field (only when no variations) */}
                        {!product.hasVariations && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Preço *</Label>
                            <Input
                              placeholder="Ex: 25.00"
                              value={product.price}
                              onChange={(e) => updateProduct(product.id, "price", e.target.value)}
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-11 rounded-xl"
                            />
                          </div>
                        )}

                        {/* Variations (only when has variations) */}
                        {product.hasVariations && (
                          <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-muted-foreground">Variações</p>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-primary h-8"
                                onClick={() => addVariation(product.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                            
                            {product.variations.map((variation, vIndex) => (
                              <div key={variation.id} className="flex gap-2 items-center">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder={`Variação ${vIndex + 1} (ex: Grande)`}
                                    value={variation.name}
                                    onChange={(e) => updateVariation(product.id, variation.id, "name", e.target.value)}
                                    className="h-10 rounded-lg text-sm"
                                  />
                                  <Input
                                    placeholder="Preço"
                                    value={variation.price}
                                    onChange={(e) => updateVariation(product.id, variation.id, "price", e.target.value)}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="h-10 rounded-lg text-sm"
                                  />
                                </div>
                                {product.variations.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => removeVariation(product.id, variation.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* ========== SEÇÃO 5: IMAGENS ========== */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Image className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Imagens da Empresa</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Fotos da empresa * (mínimo 1)</Label>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-muted">
                        <img src={preview} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => toggleFavorite(index)}
                          className={`absolute top-1 left-1 p-1 rounded-full ${favoriteIndexes.includes(index) ? 'bg-yellow-500 text-white' : 'bg-background/80'}`}
                        >
                          <Star className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label
                      htmlFor="images"
                      className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </label>
                    <input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique na ⭐ para marcar até 4 imagens favoritas (exibidas em destaque)
                  </p>
                </div>
              </div>

              {/* ========== SEÇÃO 6: TERMOS ========== */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl border bg-secondary/30">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Declaro que li e concordo com os{" "}
                    <Link to="/termos-de-uso" target="_blank" className="text-primary font-medium hover:underline">
                      Termos e Responsabilidades
                    </Link>{" "}
                    da plataforma Comércio Vizinho, incluindo as limitações de responsabilidade 
                    e os selos de identificação PF/PJ.
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6">
                <Button type="submit" className="w-full h-14 text-lg rounded-xl" disabled={loading || !termsAccepted}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Solicitação"
                  )}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                * Campos obrigatórios. Sua empresa será analisada antes de aparecer no catálogo.
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <OwnershipBlockDialog 
        open={showBlockDialog} 
        onOpenChange={setShowBlockDialog} 
        message={blockReason || ''} 
      />
    </div>
  );
}
