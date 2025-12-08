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
import { Building2, Upload, CheckCircle } from "lucide-react";
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
      const fullDescription = `Horário: ${formData.schedule}\n\nProdutos: ${formData.products}${formData.description ? `\n\n${formData.description}` : ""}`;
      const fullAddress = `${formData.address}, ${formData.neighborhood}, ${formData.city}`;

      const { error } = await supabase
        .from("establishment_requests")
        .insert([{
          name: formData.name,
          category: formData.category as EstablishmentCategory,
          neighborhood: formData.neighborhood,
          address: fullAddress,
          phone: formData.whatsapp,
          whatsapp: formData.whatsapp,
          description: fullDescription,
          external_link: formData.external_link || null,
        }]);

      if (error) throw error;

      toast.success("Solicitação enviada com sucesso!");
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <Card className="max-w-2xl mx-auto border-0 shadow-elevated rounded-3xl animate-fade-in">
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
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  <SelectContent className="rounded-xl">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-medium">Endereço Completo *</Label>
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
                <Label htmlFor="whatsapp" className="text-base font-medium">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(31) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
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
                <Label htmlFor="products" className="text-base font-medium">Produtos Oferecidos *</Label>
                <Textarea
                  id="products"
                  placeholder="Ex: Pizza, Hambúrguer, Refrigerante, Suco natural (mínimo 3)"
                  value={formData.products}
                  onChange={(e) => handleChange("products", e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Informe no mínimo 3 produtos, separados por vírgula
                </p>
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
