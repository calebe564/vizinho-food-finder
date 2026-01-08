import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

type Message = {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  status: string;
  category: string;
};

export default function UserChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (id && user) {
      loadConversation();
      loadMessages();
      markAsRead();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [id, user, authLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversation = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, status, category")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Conversa não encontrada");
      navigate("/suporte");
      return;
    }

    setConversation(data);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar mensagens");
      return;
    }

    setMessages(data || []);
    setLoading(false);
  };

  const markAsRead = async () => {
    await supabase
      .from("conversations")
      .update({ unread_count: 0 })
      .eq("id", id)
      .eq("user_id", user?.id);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`user-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_type: "user",
      content: newMessage,
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
      return;
    }

    setNewMessage("");
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container py-4 flex-1 flex flex-col">
        <Button
          variant="ghost"
          onClick={() => navigate("/suporte")}
          className="mb-4 w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="flex-1 flex flex-col max-h-[calc(100vh-200px)]">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Conversa com Administração</h2>
              <Badge variant={conversation?.status === "open" ? "default" : "secondary"}>
                {conversation?.status === "open" ? "Aberta" : "Fechada"}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Envie uma mensagem para iniciar a conversa</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[70%]">
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          msg.sender_type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(msg.created_at), "dd/MM HH:mm")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          {conversation?.status === "open" && (
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[60px] resize-none"
                />
                <Button onClick={handleSend} size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {conversation?.status !== "open" && (
            <div className="p-4 border-t bg-muted">
              <p className="text-center text-muted-foreground">
                Esta conversa foi encerrada
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
