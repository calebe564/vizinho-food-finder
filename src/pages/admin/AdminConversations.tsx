import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

type Conversation = {
  id: string;
  user_name: string;
  user_email: string;
  city_neighborhood: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function AdminConversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar conversas");
      return;
    }

    setConversations(data);
    setLoading(false);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      negociacao: "Negociação",
      investimento: "Investimento",
      duvidas: "Dúvidas",
      outro: "Outro",
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Conversas com Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie todas as conversas abertas
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma conversa registrada</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/conversas/${conv.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{conv.user_name}</h3>
                    <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                      {conv.status === "open" ? "Aberta" : "Fechada"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{conv.user_email}</p>
                  <p className="text-sm text-muted-foreground">
                    📍 {conv.city_neighborhood}
                  </p>
                  <Badge variant="outline">{getCategoryLabel(conv.category)}</Badge>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{format(new Date(conv.created_at), "dd/MM/yyyy")}</p>
                  <p>{format(new Date(conv.created_at), "HH:mm")}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}