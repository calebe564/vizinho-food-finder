import { useState, useRef, useEffect } from "react";
import { Send, LogOut, MoreVertical, UserRound, Bot } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Message = { role: "user" | "assistant"; content: string };

interface AIChatSheetProps {
  trigger?: React.ReactNode;
}

export function AIChatSheet({ trigger }: AIChatSheetProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTalkToAdmin, setLoadingTalkToAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to last message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getInitialMessage = (): Message => ({
    role: "assistant",
    content: "Olá! Sou o assistente do Comércio Vizinho.\n\nPosso ajudar você a:\n• Encontrar empresas próximas\n• Cadastrar seu negócio\n• Usar as funcionalidades do app\n\nComo posso ajudar?"
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Always start clean
      setMessages([getInitialMessage()]);
      setInput("");
    }
  };

  const handleEndSession = () => {
    setMessages([getInitialMessage()]);
    setInput("");
    setShowEndSessionDialog(false);
    toast.info("Conversa reiniciada");
  };

  const handleTalkToAdmin = async () => {
    if (!user) {
      toast.info("Faça login para falar com a administração");
      navigate("/auth");
      setIsOpen(false);
      return;
    }

    setLoadingTalkToAdmin(true);
    try {
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .maybeSingle();

      if (existingConversation) {
        navigate(`/suporte/${existingConversation.id}`);
        setIsOpen(false);
        return;
      }

      const { data: newConversation, error } = await supabase
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

      navigate(`/suporte/${newConversation.id}`);
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erro ao iniciar conversa. Tente novamente.");
    } finally {
      setLoadingTalkToAdmin(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Add placeholder for assistant response
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      // Send only user/assistant messages (exclude the initial greeting from context to AI)
      const chatHistory = updatedMessages
        .filter(m => m.content.trim())
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: chatHistory }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao conectar com o assistente");
      }

      const data = await response.json();
      const content = data.content || "Desculpe, não consegui processar sua pergunta. Tente reformular.";

      // Replace placeholder with full response (no streaming = no truncation)
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content };
        return newMessages;
      });
    } catch (error) {
      console.error("Error:", error);
      // Remove placeholder
      setMessages(prev => prev.slice(0, -1));
      toast.error("Erro ao conectar com o assistente. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" className="gap-2 justify-start w-full">
      <Bot className="h-4 w-4" />
      Assistente
    </Button>
  );

  // Render message content with line breaks
  const renderContent = (content: string) => {
    if (!content) {
      return (
        <span className="inline-flex gap-1">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
        </span>
      );
    }
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-4 border-b bg-primary text-primary-foreground flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <SheetTitle className="text-primary-foreground">Assistente</SheetTitle>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary-foreground hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleTalkToAdmin}
                      disabled={loadingTalkToAdmin}
                      className="gap-2"
                    >
                      <UserRound className="h-4 w-4" />
                      Falar com o Administrador
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowEndSessionDialog(true)}
                      className="gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Reiniciar conversa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua pergunta..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Restart dialog */}
      <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico de mensagens será apagado e uma nova conversa será iniciada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar conversando</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndSession}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
