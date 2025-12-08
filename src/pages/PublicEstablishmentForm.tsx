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
import { Building2, Upload } from "lucide-react";
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

export default function PublicEstablishmentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    neighborhood: "",
    city: "",
    address: "",
    whatsapp: "",
    schedule: "",
    products: "",
    description: "",
    external_link: "",
    logo: null as File | null
  });

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

  const validateProducts = (products: string): boolean => {
    const productList = products.split(",").map(p => p.trim()).filter(p => p.length > 0);
    return productList.length >= 3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.category || !formData.neighborhood || 
        !formData.city || !formData.address || !formData.whatsapp || 
        !formData.schedule || !formData.products) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.logo) {
      toast.error("Envie a logo da empresa");
      return;
    }

    if (!validateProducts(formData.products)) {
      toast.error("Informe pelo menos 3 produtos separados por vírgula");
      return;
    }

    setLoading(true);

    try {
      // For now, store the products in description field until admin approves
      const fullDescription = `Horário: ${formData.schedule}\n\nProdutos: ${formData.products}${formData.description ? `\n\n${formData.description}` : ""}`;
      
      // Full address for geocoding purposes
      const fullAddress = `${formData.address}, ${formData.neighborhood}, ${formData.city}`;

      const { error } = await supabase
        .from("establishment_requests")
        .insert([{
          name: formData.name,
          category: formData.category as EstablishmentCategory,
          neighborhood: formData.neighborhood,
          address: fullAddress,
          phone: formData.whatsapp, // Using phone field for WhatsApp
          whatsapp: formData.whatsapp,
          description: fullDescription,
          external_link: formData.external_link || null,
        }]);

      if (error) throw error;

      toast.success("Solicitação enviada com sucesso! Sua empresa será analisada e entrará no catálogo após aprovação.");
      navigate("/");
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Cadastrar Empresa</CardTitle>
            <CardDescription className="text-center">
              Preencha todos os campos obrigatórios. Após aprovação, sua empresa aparecerá no catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa *</Label>
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
                      className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique para enviar a logo da sua empresa
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ex: Padaria do João"
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

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Rua, número"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    placeholder="Ex: Centro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Ex: Belo Horizonte"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(31) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Horário de Funcionamento *</Label>
                <Input
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) => handleChange("schedule", e.target.value)}
                  placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 08:00-12:00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="products">Produtos Oferecidos *</Label>
                <Textarea
                  id="products"
                  placeholder="Informe no mínimo 3 produtos, separados por vírgula. Ex: Pizza, Hambúrguer, Refrigerante, Suco natural"
                  value={formData.products}
                  onChange={(e) => handleChange("products", e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 3 produtos separados por vírgula
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Conte um pouco sobre sua empresa..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_link">Site/Instagram (opcional)</Label>
                <Input
                  id="external_link"
                  type="url"
                  placeholder="https://..."
                  value={formData.external_link}
                  onChange={(e) => handleChange("external_link", e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
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
