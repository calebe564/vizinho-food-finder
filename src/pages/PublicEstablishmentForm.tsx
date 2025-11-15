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
import { Building2 } from "lucide-react";
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
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    neighborhood: "",
    address: "",
    phone: "",
    whatsapp: "",
    description: "",
    external_link: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.neighborhood || !formData.address || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("establishment_requests")
        .insert([{
          name: formData.name,
          category: formData.category as EstablishmentCategory,
          neighborhood: formData.neighborhood,
          address: formData.address,
          phone: formData.phone,
          whatsapp: formData.whatsapp || null,
          description: formData.description || null,
          external_link: formData.external_link || null,
        }]);

      if (error) throw error;

      toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
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
              Preencha o formulário abaixo. Após análise, sua empresa será incluída no catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(31) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(31) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Conte um pouco sobre sua empresa..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_link">Site/Instagram</Label>
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
                * Campos obrigatórios. Sua solicitação será analisada pela equipe do Comércio Vizinho.
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
