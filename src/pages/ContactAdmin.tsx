import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

export default function ContactAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cityNeighborhood: "",
    category: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar conversa
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_name: formData.name,
          user_email: formData.email,
          city_neighborhood: formData.cityNeighborhood,
          category: formData.category,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Criar mensagem inicial
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_type: "user",
          content: formData.message,
        });

      if (msgError) throw msgError;

      toast.success("Conversa iniciada com sucesso!");
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao criar conversa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Falar com o Administrador</h1>
              <p className="text-muted-foreground">
                Preencha o formulário para iniciar uma conversa
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Cidade / Bairro *</Label>
              <Input
                id="location"
                value={formData.cityNeighborhood}
                onChange={(e) => setFormData({ ...formData, cityNeighborhood: e.target.value })}
                placeholder="Ex: São Paulo, Pinheiros"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria de Interesse *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negociacao">Negociação</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="duvidas">Dúvidas</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem Inicial *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Iniciar Conversa"}
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}