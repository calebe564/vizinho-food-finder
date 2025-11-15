import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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

export default function AdminEstablishmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "" as EstablishmentCategory | "",
    neighborhood: "",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    whatsapp: "",
    schedule: "",
    description: "",
    external_link: "",
    is_paid: false,
    active: true,
  });

  useEffect(() => {
    if (id) {
      fetchEstablishment();
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
          address: data.address,
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          phone: data.phone,
          whatsapp: data.whatsapp || "",
          schedule: data.schedule,
          description: data.description || "",
          external_link: data.external_link || "",
          is_paid: data.is_paid,
          active: data.active,
        });
      }
    } catch (error: any) {
      console.error("Error fetching establishment:", error);
      toast.error("Erro ao carregar estabelecimento");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.address || !formData.latitude || !formData.longitude || !formData.phone || !formData.schedule) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        name: formData.name,
        category: formData.category as EstablishmentCategory,
        neighborhood: formData.neighborhood || null,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        schedule: formData.schedule,
        description: formData.description || null,
        external_link: formData.external_link || null,
        is_paid: formData.is_paid,
        active: formData.active,
      };

      if (id) {
        const { error } = await supabase
          .from("establishments")
          .update(dataToSave)
          .eq("id", id);

        if (error) throw error;
        toast.success("Estabelecimento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("establishments")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Estabelecimento criado com sucesso!");
      }

      navigate("/admin/estabelecimentos");
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/estabelecimentos")}>
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

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Horário de Funcionamento *</Label>
                <Input
                  id="schedule"
                  placeholder="Ex: Seg-Sex 8h-18h"
                  value={formData.schedule}
                  onChange={(e) => handleChange("schedule", e.target.value)}
                  required
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
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-19.9833"
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
                  placeholder="-44.0333"
                  value={formData.longitude}
                  onChange={(e) => handleChange("longitude", e.target.value)}
                  required
                />
              </div>
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
                  placeholder="5531999999999"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_link">Site / Instagram</Label>
              <Input
                id="external_link"
                type="url"
                placeholder="https://..."
                value={formData.external_link}
                onChange={(e) => handleChange("external_link", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Conte um pouco sobre o estabelecimento..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => handleChange("is_paid", checked)}
              />
              <Label htmlFor="is_paid">Empresa Patrocinada (aparece em destaque)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleChange("active", checked)}
              />
              <Label htmlFor="active">Ativa (visível no catálogo público)</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : id ? "Salvar Alterações" : "Cadastrar Empresa"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/estabelecimentos")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
