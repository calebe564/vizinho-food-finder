import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Trash2, CheckCircle, Eye } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";

type Conversation = {
  id: string;
  user_name: string;
  user_email: string;
  city_neighborhood: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count: number | null;
};

export default function AdminConversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

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

  const handleMarkAsRead = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingRead(convId);
    
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", convId);

      if (error) throw error;

      setConversations(prev => 
        prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c)
      );
      toast.success("Conversa marcada como lida");
    } catch (err) {
      console.error("Error marking as read:", err);
      toast.error("Erro ao marcar como lida");
    } finally {
      setMarkingRead(null);
    }
  };

  const handleDeleteConversation = async () => {
    if (!deleteId) return;

    try {
      // Primeiro deletar todas as mensagens
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", deleteId);

      // Depois deletar a conversa
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== deleteId));
      toast.success("Conversa excluída com sucesso");
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast.error("Erro ao excluir conversa");
    } finally {
      setDeleteId(null);
    }
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
              onClick={() => navigate(`/admin/dashboard/conversas/${conv.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{conv.user_name}</h3>
                    <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                      {conv.status === "open" ? "Aberta" : "Fechada"}
                    </Badge>
                    {(conv.unread_count ?? 0) > 0 && (
                      <Badge className="bg-blue-500 text-white">
                        {conv.unread_count} não lida(s)
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{conv.user_email}</p>
                  <p className="text-sm text-muted-foreground">
                    📍 {conv.city_neighborhood}
                  </p>
                  <Badge variant="outline">{getCategoryLabel(conv.category)}</Badge>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-muted-foreground">
                    <p>{format(new Date(conv.created_at), "dd/MM/yyyy")}</p>
                    <p>{format(new Date(conv.created_at), "HH:mm")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleMarkAsRead(conv.id, e)}
                      disabled={markingRead === conv.id || (conv.unread_count ?? 0) === 0}
                      title="Marcar como lida"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(conv.id);
                      }}
                      title="Excluir conversa"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmPasswordDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConversation}
        title="Excluir Conversa"
        description="Esta ação é irreversível. Todas as mensagens serão excluídas permanentemente."
        actionLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}