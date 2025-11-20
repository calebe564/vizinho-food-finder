import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { format } from "date-fns";

type Message = {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  user_name: string;
  category: string;
};

export default function UserChat() {
  const { id } = useParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadConversation();
      loadMessages();
      subscribeToMessages();
    }
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversation = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar conversa");
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

    setMessages(data);
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-changes")
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">{conversation?.user_name}</h2>
            <p className="text-sm text-muted-foreground">
              Categoria: {conversation?.category}
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
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
                      {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
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
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}