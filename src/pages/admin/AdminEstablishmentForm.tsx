import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Plus, Star, Package, Image, Building2, MapPin, Loader2, UserPlus, Home, Truck } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { InviteAdminDialog } from "@/components/business/InviteAdminDialog";
import { CNPJInput } from "@/components/CNPJInput";
import { useCNPJLookup } from "@/hooks/useCNPJLookup";
import { CategorySelectItems } from "@/components/CategorySelectItems";

type EstablishmentCategory = Database["public"]["Enums"]["establishment_category"];

const brazilianStates = [
  { uf: "AC", name: "Acre" }, { uf: "AL", name: "Alagoas" }, { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" }, { uf: "BA", name: "Bahia" }, { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" }, { uf: "ES", name: "Espírito Santo" }, { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" }, { uf: "MT", name: "Mato Grosso" }, { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" }, { uf: "PA", name: "Pará" }, { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" }, { uf: "PE", name: "Pernambuco" }, { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" }, { uf: "RN", name: "Rio Grande do Norte" }, { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" }, { uf: "RR", name: "Roraima" }, { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" }, { uf: "SE", name: "Sergipe" }, { uf: "TO", name: "Tocantins" }
];

interface ProductVariation {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  newImage?: File | null;
  newImagePreview?: string | null;
  variations: ProductVariation[];
}

export default function AdminEstablishmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [pendingPaidValue, setPendingPaidValue] = useState(false);
  const { lookup: lookupCNPJ, isLoading: cnpjLoading } = useCNPJLookup();
  
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    neighborhood: "",
    region: "",
    city: "",
    state: "SP",
    address: "",
    cep: "",
    phone: "",
    whatsapp: "",
    schedule: "",
    description: "",
    external_link: "",
    google_maps_link: "",
    reference_point: "",
    is_paid: false,
    active: true,
    cnpj: "",
    has_delivery: false,
    delivery_type: "",
    delivery_other: "",
  });
  
  // Estado para troca de CNPJ
  const [showCnpjChange, setShowCnpjChange] = useState(false);
  const [newCnpj, setNewCnpj] = useState("");
  const [cnpjJustification, setCnpjJustification] = useState("");
  const [cnpjAutoFilled, setCnpjAutoFilled] = useState(false);

  // Images state
  const [profileImage, setProfileImage] = useState<string>("");
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string>("");
  const [newBannerImage, setNewBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [favoriteImages, setFavoriteImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (id) {
      fetchEstablishment();
      fetchProducts();
    }
  }, [id]);

  const fetchEstablishment = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          category: data.category as EstablishmentCategory,
          neighborhood: data.neighborhood || "",
          region: data.region || "",
          city: data.city || "São Paulo",
          state: data.state || "SP",
          address: data.address,
          cep: data.cep || "",
          phone: data.phone,
          whatsapp: data.whatsapp || "",
          schedule: data.schedule,
          description: data.description || "",
          external_link: data.external_link || "",
          google_maps_link: data.google_maps_link || "",
          reference_point: data.reference_point || "",
          is_paid: data.is_paid || false,
          active: data.active ?? true,
          cnpj: data.cnpj || "",
          has_delivery: data.has_delivery || false,
          delivery_type: data.delivery_type || "",
          delivery_other: data.delivery_other || "",
        });
        setProfileImage(data.profile_image || "");
        setBannerImage(data.banner_image || "");
        setImages((data.images as string[]) || []);
        setFavoriteImages((data.favorite_images as string[]) || []);
        
        // Mark as auto-filled if CNPJ exists
        if (data.cnpj) {
          setCnpjAutoFilled(true);
        }
      }
    } catch (error) {
      console.error("Error fetching establishment:", error);
      toast.error("Erro ao carregar estabelecimento");
    }
  };

  const fetchProducts = async () => {
    if (!id) return;

    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("establishment_id", id);

      if (productsError) throw productsError;

      const { data: variationsData, error: variationsError } = await supabase
        .from("product_variations")
        .select("*");

      if (variationsError) throw variationsError;

      const productsWithVariations = (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description || "",
        image: p.image || "",
        variations: (variationsData || [])
          .filter(v => v.product_id === p.id)
          .map(v => ({
            id: v.id,
            name: v.name,
            price: Number(v.price)
          }))
      }));

      setProducts(productsWithVariations);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // CNPJ lookup and auto-fill
  const handleCNPJLookup = async (cnpjData: {
    razaoSocial: string;
    nomeFantasia: string;
    municipio: string;
    uf: string;
    bairro: string;
    logradouro: string;
    numero: string;
    cep: string;
    telefone: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      name: cnpjData.nomeFantasia || cnpjData.razaoSocial || prev.name,
      city: cnpjData.municipio || prev.city,
      state: cnpjData.uf || prev.state,
      neighborhood: cnpjData.bairro || prev.neighborhood,
      address: cnpjData.logradouro ? `${cnpjData.logradouro}${cnpjData.numero ? `, ${cnpjData.numero}` : ""}` : prev.address,
      cep: cnpjData.cep || prev.cep,
      phone: cnpjData.telefone || prev.phone,
    }));
    setCnpjAutoFilled(true);
    toast.success("Dados do CNPJ preenchidos automaticamente!");
  };

  // CEP Lookup
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    
    if (cep.length !== 8) return;

    setLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Check if the fetched address matches user input
      const newCity = data.localidade || formData.city;
      const newNeighborhood = data.bairro || formData.neighborhood;
      const newState = data.uf || formData.state;

      // Alert if there's a mismatch
      if (formData.city && formData.city !== newCity) {
        toast.warning(`CEP corresponde a ${newCity}, não a ${formData.city}. Dados atualizados.`);
      }

      setFormData(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: newNeighborhood,
        city: newCity,
        state: newState,
        region: getRegionFromNeighborhood(newNeighborhood) || prev.region
      }));

      toast.success("Endereço encontrado!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  // Helper function to determine region from neighborhood
  const getRegionFromNeighborhood = (bairro: string): string => {
    const northZone = ["Santana", "Tucuruvi", "Jaçanã", "Tremembé", "Vila Maria", "Casa Verde"];
    const southZone = ["Moema", "Ipiranga", "Santo Amaro", "Jabaquara", "Campo Limpo", "Capela do Socorro"];
    const eastZone = ["Tatuapé", "Penha", "São Miguel", "Itaquera", "Guaianazes", "Ermelino Matarazzo"];
    const westZone = ["Pinheiros", "Butantã", "Lapa", "Jaguaré", "Alto de Pinheiros"];
    const centralZone = ["Sé", "República", "Bela Vista", "Consolação", "Liberdade", "Santa Cecília"];

    const bairroLower = bairro.toLowerCase();
    
    if (northZone.some(b => bairroLower.includes(b.toLowerCase()))) return "Zona Norte";
    if (southZone.some(b => bairroLower.includes(b.toLowerCase()))) return "Zona Sul";
    if (eastZone.some(b => bairroLower.includes(b.toLowerCase()))) return "Zona Leste";
    if (westZone.some(b => bairroLower.includes(b.toLowerCase()))) return "Zona Oeste";
    if (centralZone.some(b => bairroLower.includes(b.toLowerCase()))) return "Centro";
    
    return "";
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      setNewImages(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (url: string) => {
    setImages(prev => prev.filter(img => img !== url));
    setFavoriteImages(prev => prev.filter(img => img !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFavorite = (url: string) => {
    if (favoriteImages.includes(url)) {
      setFavoriteImages(prev => prev.filter(img => img !== url));
    } else if (favoriteImages.length < 4) {
      setFavoriteImages(prev => [...prev, url]);
    } else {
      toast.error("Máximo de 4 imagens favoritas");
    }
  };

  // Product management
  const addProduct = () => {
    setProducts(prev => [...prev, {
      id: `new-${crypto.randomUUID()}`,
      name: "",
      price: 0,
      description: "",
      image: "",
      newImage: null,
      newImagePreview: null,
      variations: []
    }]);
  };

  const removeProduct = async (productId: string) => {
    if (productId.startsWith("new-")) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      try {
        await supabase.from("product_variations").delete().eq("product_id", productId);
        await supabase.from("products").delete().eq("id", productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast.success("Produto removido");
      } catch (error) {
        toast.error("Erro ao remover produto");
      }
    }
  };

  const updateProduct = (productId: string, field: keyof Product, value: Product[keyof Product]) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p));
  };

  const handleProductImageChange = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, newImage: file, newImagePreview: reader.result as string } : p
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariation = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, variations: [...p.variations, { id: `new-${crypto.randomUUID()}`, name: "", price: 0 }] }
        : p
    ));
  };

  const removeVariation = async (productId: string, variationId: string) => {
    if (variationId.startsWith("new-")) {
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, variations: p.variations.filter(v => v.id !== variationId) } : p
      ));
    } else {
      try {
        await supabase.from("product_variations").delete().eq("id", variationId);
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, variations: p.variations.filter(v => v.id !== variationId) } : p
        ));
      } catch (error) {
        toast.error("Erro ao remover variação");
      }
    }
  };

  const updateVariation = (productId: string, variationId: string, field: "name" | "price", value: string | number) => {
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

  const handleIsPaidChange = (checked: boolean) => {
    if (checked) {
      setPendingPaidValue(true);
      setShowPaidConfirm(true);
    } else {
      setFormData(prev => ({ ...prev, is_paid: false }));
    }
  };

  const confirmPaidChange = () => {
    setFormData(prev => ({ ...prev, is_paid: pendingPaidValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - NO latitude/longitude required
    if (!formData.name || !formData.category || !formData.address || !formData.phone || !formData.schedule) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.neighborhood || !formData.city) {
      toast.error("Bairro e cidade são obrigatórios");
      return;
    }

    setLoading(true);

    try {
      // Upload new profile image (logo) if exists
      let finalProfileImage = profileImage;
      if (newProfileImage) {
        const ext = newProfileImage.name.split(".").pop();
        const path = `logos/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("establishment-images").upload(path, newProfileImage);
        if (!error) {
          const { data } = supabase.storage.from("establishment-images").getPublicUrl(path);
          finalProfileImage = data.publicUrl;
        }
      }

      // Upload new banner if exists
      let finalBannerImage = bannerImage;
      if (newBannerImage) {
        const ext = newBannerImage.name.split(".").pop();
        const path = `banners/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("establishment-images").upload(path, newBannerImage);
        if (!error) {
          const { data } = supabase.storage.from("establishment-images").getPublicUrl(path);
          finalBannerImage = data.publicUrl;
        }
      }

      // Upload new images
      const allImages = [...images];
      for (const file of newImages) {
        const ext = file.name.split(".").pop();
        const path = `establishments/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("establishment-images").upload(path, file);
        if (!error) {
          const { data } = supabase.storage.from("establishment-images").getPublicUrl(path);
          allImages.push(data.publicUrl);
        }
      }

      // Note: ADM is NEVER the owner - establishments created by ADM have no owner
      const dataToSave = {
        name: formData.name,
        category: formData.category as EstablishmentCategory,
        neighborhood: formData.neighborhood || null,
        region: formData.region || null,
        city: formData.city,
        state: formData.state || "SP",
        cep: formData.cep || null,
        address: formData.address,
        latitude: 0, // Default value - not used for location
        longitude: 0, // Default value - not used for location
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        schedule: formData.schedule,
        description: formData.description || null,
        external_link: formData.external_link || null,
        google_maps_link: formData.google_maps_link || null,
        reference_point: formData.reference_point || null,
        is_paid: formData.is_paid,
        active: formData.active,
        profile_image: finalProfileImage || null,
        banner_image: finalBannerImage || null,
        images: allImages,
        favorite_images: favoriteImages,
        cnpj: formData.cnpj || null,
        has_delivery: formData.has_delivery,
        delivery_type: formData.has_delivery ? formData.delivery_type : null,
        delivery_other: formData.has_delivery && formData.delivery_type === "outro" ? formData.delivery_other : null,
      };

      if (id) {
        const { error } = await supabase
          .from("establishments")
          .update(dataToSave)
          .eq("id", id);

        if (error) throw error;

        // Save products
        for (const product of products) {
          let productImageUrl = product.image;
          if (product.newImage) {
            const ext = product.newImage.name.split(".").pop();
            const path = `products/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from("establishment-images").upload(path, product.newImage);
            if (!error) {
              const { data } = supabase.storage.from("establishment-images").getPublicUrl(path);
              productImageUrl = data.publicUrl;
            }
          }

          if (product.id.startsWith("new-")) {
            const { data: newProduct, error } = await supabase
              .from("products")
              .insert({
                establishment_id: id,
                name: product.name,
                price: product.price,
                description: product.description || null,
                image: productImageUrl || null
              })
              .select()
              .single();

            if (!error && newProduct) {
              for (const variation of product.variations) {
                await supabase.from("product_variations").insert({
                  product_id: newProduct.id,
                  name: variation.name,
                  price: variation.price
                });
              }
            }
          } else {
            await supabase
              .from("products")
              .update({
                name: product.name,
                price: product.price,
                description: product.description || null,
                image: productImageUrl || null
              })
              .eq("id", product.id);

            for (const variation of product.variations) {
              if (variation.id.startsWith("new-")) {
                await supabase.from("product_variations").insert({
                  product_id: product.id,
                  name: variation.name,
                  price: variation.price
                });
              } else {
                await supabase.from("product_variations")
                  .update({ name: variation.name, price: variation.price })
                  .eq("id", variation.id);
              }
            }
          }
        }

        toast.success("Estabelecimento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("establishments")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Estabelecimento criado com sucesso!");
      }

      navigate("/admin/dashboard/estabelecimentos");
    } catch (error) {
      console.error("Error saving establishment:", error);
      toast.error("Erro ao salvar estabelecimento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard/estabelecimentos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {id ? "Editar Empresa" : "Adicionar Empresa"}
          </h2>
          <p className="text-muted-foreground">
            {id ? "Atualize os dados do estabelecimento" : "Cadastre um novo estabelecimento"}
          </p>
        </div>
        {/* Back to public area button */}
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Área Pública
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dados da Empresa</h3>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {(profilePreview || profileImage) ? (
                  <img 
                    src={profilePreview || profileImage} 
                    alt="Logo" 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-muted" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {profileImage ? "Trocar Logo" : "Adicionar Logo"}
                      </span>
                    </Button>
                  </label>
                  {(profilePreview || profileImage) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProfileImage("");
                        setNewProfileImage(null);
                        setProfilePreview(null);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recomendado: imagem quadrada (1:1) de pelo menos 200x200px
              </p>
            </div>

            {/* CNPJ with API lookup */}
            <div className="space-y-2">
              <CNPJInput
                value={formData.cnpj}
                onChange={(value) => handleChange("cnpj", value)}
                onLookupSuccess={handleCNPJLookup}
                showLookupButton={true}
                disabled={cnpjAutoFilled && !!formData.cnpj}
                label="CNPJ (consulta automática)"
              />
              {cnpjAutoFilled && formData.cnpj && (
                <p className="text-xs text-amber-600">
                  ⚠️ Razão social preenchida automaticamente. Para alterar, remova o CNPJ.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={cnpjAutoFilled}
                  className={cnpjAutoFilled ? "bg-muted" : ""}
                />
                {cnpjAutoFilled && (
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente pelo CNPJ
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    <CategorySelectItems />
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição / Slogan</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                placeholder="Ex: O melhor pão da região!"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Card - NO LATITUDE/LONGITUDE */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Localização</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select value={formData.state} onValueChange={(value) => handleChange("state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {brazilianStates.map((state) => (
                      <SelectItem key={state.uf} value={state.uf}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Região</Label>
                <Select value={formData.region} onValueChange={(value) => handleChange("region", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Centro">Centro</SelectItem>
                    <SelectItem value="Zona Norte">Zona Norte</SelectItem>
                    <SelectItem value="Zona Sul">Zona Sul</SelectItem>
                    <SelectItem value="Zona Leste">Zona Leste</SelectItem>
                    <SelectItem value="Zona Oeste">Zona Oeste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_point">Ponto de Referência</Label>
                <Input
                  id="reference_point"
                  value={formData.reference_point}
                  onChange={(e) => handleChange("reference_point", e.target.value)}
                  placeholder="Ex: Próximo ao metrô"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_maps_link">Link do Google Maps</Label>
              <Input
                id="google_maps_link"
                type="url"
                value={formData.google_maps_link}
                onChange={(e) => handleChange("google_maps_link", e.target.value)}
                placeholder="https://maps.google.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Cole o link do Google Maps para facilitar a navegação
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Delivery Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Contato e Funcionamento</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Horário de Funcionamento *</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => handleChange("schedule", e.target.value)}
                required
                placeholder="Ex: Seg-Sex 8h-18h, Sáb 8h-12h"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_link">Site / Instagram</Label>
              <Input
                id="external_link"
                type="url"
                value={formData.external_link}
                onChange={(e) => handleChange("external_link", e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Delivery Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Delivery</h4>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="has_delivery"
                  checked={formData.has_delivery}
                  onCheckedChange={(checked) => handleChange("has_delivery", checked)}
                />
                <Label htmlFor="has_delivery">Possui delivery?</Label>
              </div>

              {formData.has_delivery && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_type">Tipo de Delivery</Label>
                    <Select value={formData.delivery_type} onValueChange={(value) => handleChange("delivery_type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprio">Delivery Próprio</SelectItem>
                        <SelectItem value="ifood">iFood</SelectItem>
                        <SelectItem value="uber_eats">Uber Eats</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.delivery_type === "outro" && (
                    <div className="space-y-2">
                      <Label htmlFor="delivery_other">Especifique</Label>
                      <Input
                        id="delivery_other"
                        value={formData.delivery_other}
                        onChange={(e) => handleChange("delivery_other", e.target.value)}
                        placeholder="Ex: Rappi, 99Food..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={handleIsPaidChange}
              />
              <Label htmlFor="is_paid">Empresa Patrocinada / Destaque</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleChange("active", checked)}
              />
              <Label htmlFor="active">Empresa Ativa</Label>
            </div>
          </CardContent>
        </Card>

        {/* Images Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Image className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Imagens</h3>
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Banner Principal</Label>
              <div className="flex flex-col gap-4">
                {(bannerPreview || bannerImage) ? (
                  <img 
                    src={bannerPreview || bannerImage} 
                    alt="Banner" 
                    className="w-full h-40 rounded-xl object-cover border-2 border-muted" 
                  />
                ) : (
                  <div className="w-full h-40 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <p className="text-muted-foreground">Nenhum banner adicionado</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {bannerImage ? "Trocar Banner" : "Adicionar Banner"}
                      </span>
                    </Button>
                  </label>
                  {(bannerPreview || bannerImage) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBannerImage("");
                        setNewBannerImage(null);
                        setBannerPreview(null);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Galeria de Imagens</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Adicione imagens da empresa. Clique na estrela para marcar como favorita (máx. 4).
              </p>
              
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {images.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-yellow-400"
                        onClick={() => toggleFavorite(url)}
                      >
                        <Star className={`h-4 w-4 ${favoriteImages.includes(url) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-red-400"
                        onClick={() => removeExistingImage(url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img src={preview} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-red-400"
                        onClick={() => removeNewImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImagesChange}
                    className="hidden"
                  />
                  <div className="w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        {id && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Produtos</h3>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>

              {products.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum produto cadastrado. Clique em "Adicionar Produto" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {products.map((product, pIndex) => (
                    <div key={product.id} className="border rounded-xl p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Produto {pIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Nome do Produto *</Label>
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                            placeholder="Ex: Pão Francês"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço Base (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, "price", parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Imagem</Label>
                          <div className="flex items-center gap-2">
                            {(product.newImagePreview || product.image) && (
                              <img
                                src={product.newImagePreview || product.image}
                                alt=""
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <label className="cursor-pointer flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleProductImageChange(product.id, e)}
                                className="hidden"
                              />
                              <Button type="button" variant="outline" size="sm" asChild className="w-full">
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Imagem
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={product.description}
                          onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                          rows={2}
                          placeholder="Descrição do produto..."
                        />
                      </div>

                      {/* Variations */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Variações de Preço</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addVariation(product.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Variação
                          </Button>
                        </div>
                        {product.variations.map((variation) => (
                          <div key={variation.id} className="flex items-center gap-2">
                            <Input
                              value={variation.name}
                              onChange={(e) => updateVariation(product.id, variation.id, "name", e.target.value)}
                              placeholder="Ex: 500g"
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.price}
                              onChange={(e) => updateVariation(product.id, variation.id, "price", parseFloat(e.target.value) || 0)}
                              placeholder="R$"
                              className="w-24"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeVariation(product.id, variation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              id ? "Atualizar Empresa" : "Criar Empresa"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/dashboard/estabelecimentos")}
          >
            Cancelar
          </Button>
        </div>
      </form>

      <ConfirmPasswordDialog
        open={showPaidConfirm}
        onOpenChange={setShowPaidConfirm}
        onConfirm={confirmPaidChange}
        title="Confirmar Destaque"
        description="Para marcar esta empresa como destaque/patrocinada, confirme sua senha de administrador."
      />
    </div>
  );
}