import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Plus, Star, Package, Image, Building2, MapPin, Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";

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
  
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    neighborhood: "",
    region: "",
    city: "",
    address: "",
    cep: "",
    latitude: "",
    longitude: "",
    phone: "",
    whatsapp: "",
    schedule: "",
    description: "",
    external_link: "",
    google_maps_link: "",
    reference_point: "",
    is_paid: false,
    active: true,
  });

  // Images state
  const [profileImage, setProfileImage] = useState<string>("");
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
          address: data.address,
          cep: "",
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          phone: data.phone,
          whatsapp: data.whatsapp || "",
          schedule: data.schedule,
          description: data.description || "",
          external_link: data.external_link || "",
          google_maps_link: data.google_maps_link || "",
          reference_point: data.reference_point || "",
          is_paid: data.is_paid || false,
          active: data.active ?? true,
        });
        setProfileImage(data.profile_image || "");
        setBannerImage(data.banner_image || "");
        setImages((data.images as string[]) || []);
        setFavoriteImages((data.favorite_images as string[]) || []);
      }
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error fetching products:", error);
    }
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

      setFormData(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        region: getRegionFromNeighborhood(data.bairro) || prev.region
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
    // Basic region mapping for São Paulo - can be expanded
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

  const updateProduct = (productId: string, field: keyof Product, value: any) => {
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
      // Requires confirmation to mark as paid/featured
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

    if (!formData.name || !formData.category || !formData.address || !formData.latitude || !formData.longitude || !formData.phone || !formData.schedule) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.google_maps_link) {
      toast.error("O link do Google Maps é obrigatório");
      return;
    }

    setLoading(true);

    try {
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

      const dataToSave = {
        name: formData.name,
        category: formData.category as EstablishmentCategory,
        neighborhood: formData.neighborhood || null,
        region: formData.region || null,
        city: formData.city,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        schedule: formData.schedule,
        description: formData.description || null,
        external_link: formData.external_link || null,
        google_maps_link: formData.google_maps_link || null,
        reference_point: formData.reference_point || null,
        is_paid: formData.is_paid,
        active: formData.active,
        banner_image: finalBannerImage || null,
        images: allImages,
        favorite_images: favoriteImages,
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
    } catch (error: any) {
      console.error("Error saving establishment:", error);
      toast.error("Erro ao salvar estabelecimento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard/estabelecimentos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {id ? "Editar Empresa" : "Adicionar Empresa"}
          </h2>
          <p className="text-muted-foreground">
            {id ? "Atualize os dados do estabelecimento" : "Cadastre um novo estabelecimento"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dados da Empresa</h3>
            </div>

            {/* Logo (read-only) */}
            {profileImage && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Logo da Empresa (não editável)</Label>
                <div className="flex items-center gap-4">
                  <img src={profileImage} alt="Logo" className="w-20 h-20 rounded-xl object-cover border-2 border-muted" />
                  <p className="text-sm text-muted-foreground">A logo não pode ser alterada após o cadastro.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
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

        {/* Address Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Localização</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

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
                <Label htmlFor="region">Região *</Label>
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
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
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
              <Label htmlFor="google_maps_link">Link do Google Maps *</Label>
              <Input
                id="google_maps_link"
                type="url"
                value={formData.google_maps_link}
                onChange={(e) => handleChange("google_maps_link", e.target.value)}
                required
                placeholder="https://maps.google.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Cole o link do Google Maps do endereço exato da empresa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleChange("latitude", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleChange("longitude", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
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

            <div className="flex items-center space-x-2">
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
              <Label htmlFor="active">Ativa (visível no catálogo)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Images Card */}
        {id && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Image className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Imagens da Empresa</h3>
              </div>

              {/* Banner */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Banner</Label>
                <div className="flex items-center gap-4">
                  {(bannerPreview || bannerImage) && (
                    <img
                      src={bannerPreview || bannerImage}
                      alt="Banner"
                      className="w-40 h-20 rounded-xl object-cover border"
                    />
                  )}
                  <label className="flex flex-col items-center justify-center px-4 py-2 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs mt-1">Alterar banner</span>
                    <input type="file" accept="image/*" onChange={handleBannerChange} className="sr-only" />
                  </label>
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Galeria de Fotos</Label>
                <div className="flex flex-wrap gap-3">
                  {images.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-muted">
                      <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(url)}
                        className={`absolute top-1 left-1 p-1 rounded-full ${favoriteImages.includes(url) ? 'bg-yellow-500 text-white' : 'bg-background/80'}`}
                      >
                        <Star className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {newImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-primary">
                      <img src={preview} alt={`Nova ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple onChange={handleNewImagesChange} className="sr-only" />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">⭐ Clique na estrela para marcar favoritas (máx. 4)</p>
              </div>
            </CardContent>
          </Card>
        )}

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

              <div className="space-y-4">
                {products.map((product, index) => (
                  <Card key={product.id} className="p-4 bg-secondary/30 border-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Produto {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                            placeholder="Nome do produto"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, "price", parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Product Image */}
                      <div className="space-y-2">
                        <Label>Imagem do Produto *</Label>
                        <div className="flex items-center gap-3">
                          {(product.newImagePreview || product.image) && (
                            <img
                              src={product.newImagePreview || product.image}
                              alt="Produto"
                              className="w-16 h-16 rounded-xl object-cover border"
                            />
                          )}
                          <label className="flex flex-col items-center justify-center px-3 py-2 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs mt-1">{product.image ? "Alterar" : "Adicionar"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleProductImageChange(product.id, e)}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={product.description}
                          onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                          rows={2}
                          placeholder="Descrição do produto"
                        />
                      </div>

                      {/* Variations */}
                      <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Variações</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => addVariation(product.id)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        {product.variations.map((variation, vIndex) => (
                          <div key={variation.id} className="flex gap-2 items-center">
                            <Input
                              placeholder={`Nome da variação ${vIndex + 1}`}
                              value={variation.name}
                              onChange={(e) => updateVariation(product.id, variation.id, "name", e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Preço"
                              value={variation.price}
                              onChange={(e) => updateVariation(product.id, variation.id, "price", parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeVariation(product.id, variation.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : id ? "Salvar Alterações" : "Cadastrar Empresa"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/dashboard/estabelecimentos")}>
            Cancelar
          </Button>
        </div>
      </form>

      <ConfirmPasswordDialog
        open={showPaidConfirm}
        onOpenChange={setShowPaidConfirm}
        onConfirm={confirmPaidChange}
        title="Marcar como Destaque"
        description="Esta ação marcará a empresa como patrocinada/destaque. Digite a senha de administrador para confirmar."
        actionLabel="Confirmar Destaque"
      />
    </div>
  );
}
