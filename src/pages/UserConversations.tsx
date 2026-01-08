import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Plus, ArrowLeft } from "lucide-react";

type Conversation = {
  id: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
};

export default function UserConversations() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadConversations();
      subscribeToConversations();
    }
  }, [user, authLoading]);

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("id, category, status, created_at, updated_at, unread_count")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar conversas");
      return;
    }

    setConversations(data || []);
    setLoading(false);
  };

  const subscribeToConversations = () => {
    if (!user) return;

    const channel = supabase
      .channel("user-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          user_name: profile?.full_name || "Usuário",
          user_email: user.email || "",
          city_neighborhood: "Não informado",
          category: "duvidas",
          status: "open",
        })
        .select("id")
        .single();

      if (error) throw error;

      navigate(`/suporte/${data.id}`);
    } catch (error) {
      toast.error("Erro ao criar conversa");
    }
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Suporte</h1>
        </div>

        <Button onClick={handleNewConversation} className="mb-6 gap-2">
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>

        {conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma conversa ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Nova Conversa" para falar com a administração
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => navigate(`/suporte/${conv.id}`)}
              >
                {conv.unread_count > 0 && (
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-destructive rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-destructive-foreground">
                      {conv.unread_count}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getCategoryLabel(conv.category)}</Badge>
                      <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                        {conv.status === "open" ? "Aberta" : "Fechada"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Criada em {format(new Date(conv.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Atualizada</p>
                    <p>{format(new Date(conv.updated_at), "dd/MM HH:mm")}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
