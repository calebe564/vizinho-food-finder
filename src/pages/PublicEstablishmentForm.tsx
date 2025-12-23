import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Building2, Upload, CheckCircle, Plus, Trash2, Star } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

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
  variations: ProductVariation[];
}

export default function PublicEstablishmentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [favoriteIndexes, setFavoriteIndexes] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    neighborhood: "",
    city: "",
    address: "",
    whatsapp: "", // Campo obrigatório - Telefone/WhatsApp
    schedule: "",
    description: "",
    external_link: "",
    logo: null as File | null
  });
  
  const [products, setProducts] = useState<Product[]>([
    { id: crypto.randomUUID(), name: "", price: "", variations: [] }
  ]);

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
      variations: [] 
    }]);
  };

  const removeProduct = (productId: string) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const updateProduct = (productId: string, field: "name" | "price", value: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
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

  const validateProducts = (): boolean => {
    for (const product of products) {
      if (!product.name.trim()) {
        toast.error("Todos os produtos devem ter um nome");
        return false;
      }
      if (!product.price.trim() || isNaN(parseFloat(product.price))) {
        toast.error(`O produto "${product.name}" precisa ter um preço válido`);
        return false;
      }
      for (const variation of product.variations) {
        if (variation.name.trim() && (!variation.price.trim() || isNaN(parseFloat(variation.price)))) {
          toast.error(`A variação "${variation.name}" precisa ter um preço válido`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.neighborhood || 
        !formData.city || !formData.address || !formData.whatsapp || !formData.schedule) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar formato do WhatsApp (apenas números, mínimo 10 dígitos)
    const whatsappClean = formData.whatsapp.replace(/\D/g, "");
    if (whatsappClean.length < 10) {
      toast.error("Número de WhatsApp inválido. Use o formato: DDI + DDD + número");
      return;
    }

    if (!formData.logo) {
      toast.error("Envie a logo da empresa");
      return;
    }

    if (images.length === 0) {
      toast.error("Envie pelo menos uma imagem da empresa");
      return;
    }

    if (products.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    if (!validateProducts()) {
      return;
    }

    setLoading(true);

    try {
      const fullAddress = `${formData.address}, ${formData.neighborhood}, ${formData.city}`;

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

      // Prepare products JSON
      const productsJson = products
        .filter(p => p.name.trim() && p.price.trim())
        .map(p => ({
          name: p.name,
          price: parseFloat(p.price),
          variations: p.variations
            .filter(v => v.name.trim() && v.price.trim())
            .map(v => ({
              name: v.name,
              price: parseFloat(v.price)
            }))
        }));

      const { error } = await supabase
        .from("establishment_requests")
        .insert([{
          name: formData.name,
          category: formData.category as EstablishmentCategory,
          neighborhood: formData.neighborhood,
          address: fullAddress,
          phone: formData.whatsapp, // Usa o WhatsApp como telefone principal
          whatsapp: formData.whatsapp,
          description: formData.description || null,
          external_link: formData.external_link || null,
          schedule: formData.schedule,
          products_json: productsJson,
          images: uploadedImages,
          favorite_images: favoriteImages
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
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Images Upload */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Imagens da Empresa * (mínimo 1)</Label>
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
                  Clique na ⭐ para marcar até 4 imagens favoritas (exibidas no carrossel da home)
                </p>
              </div>

              {/* Basic Info */}
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

              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-medium">Endereço *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Rua, número"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="text-base font-medium">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    placeholder="Ex: Centro"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-base font-medium">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Ex: Belo Horizonte"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-base font-medium">Telefone / WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="5511999999999 (DDI + DDD + número)"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formato: DDI + DDD + número (ex: 5531999999999)
                </p>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="external_link" className="text-base font-medium">Site/Instagram (opcional)</Label>
                <Input
                  id="external_link"
                  type="url"
                  placeholder="https://..."
                  value={formData.external_link}
                  onChange={(e) => handleChange("external_link", e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Products Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">Produtos Oferecidos *</Label>
                    <p className="text-sm text-muted-foreground">Adicione os produtos com seus preços</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addProduct} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>

                <div className="space-y-4">
                  {products.map((product, index) => (
                    <Card key={product.id} className="p-4 bg-secondary/30 rounded-2xl border-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Nome do produto (ex: Pizza, Pão)"
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                            className="h-11 rounded-xl"
                          />
                          <Input
                            placeholder="Preço (ex: 25.00)"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, "price", e.target.value)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-11 rounded-xl"
                          />
                        </div>

                        {/* Variations */}
                        {product.variations.length > 0 && (
                          <div className="pl-4 border-l-2 border-primary/30 space-y-2 mt-3">
                            <p className="text-xs font-medium text-muted-foreground">Variações (tamanhos, opções)</p>
                            {product.variations.map((variation) => (
                              <div key={variation.id} className="flex gap-2 items-center">
                                <Input
                                  placeholder="Nome (ex: Grande, 600ml)"
                                  value={variation.name}
                                  onChange={(e) => updateVariation(product.id, variation.id, "name", e.target.value)}
                                  className="h-9 rounded-lg text-sm"
                                />
                                <Input
                                  placeholder="Preço"
                                  value={variation.price}
                                  onChange={(e) => updateVariation(product.id, variation.id, "price", e.target.value)}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="h-9 rounded-lg text-sm w-28"
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
                        )}

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-primary"
                          onClick={() => addVariation(product.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar variação (tamanho, opção)
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full h-14 text-lg rounded-xl" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Solicitação"}
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
    </div>
  );
}
