import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, LogOut, MoreVertical, UserRound, Bot } from "lucide-react";
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

const CHAT_SESSION_KEY = "ai_chat_session";
const CHAT_MESSAGES_KEY = "ai_chat_messages";

interface AIChatSheetProps {
  trigger?: React.ReactNode;
}

export function AIChatSheet({ trigger }: AIChatSheetProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTalkToAdmin, setLoadingTalkToAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing session
  useEffect(() => {
    const savedSession = localStorage.getItem(CHAT_SESSION_KEY);
    const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);
    
    if (savedSession === "active" && savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          setHasActiveSession(true);
        }
      } catch (e) {
        console.error("Error parsing saved messages:", e);
        clearSession();
      }
    }
  }, []);

  // Save messages when updated
  useEffect(() => {
    if (hasActiveSession && messages.length > 0) {
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages, hasActiveSession]);

  // Scroll to last message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewSession = () => {
    const initialMessage: Message = {
      role: "assistant",
      content: "Olá! Sou o assistente do Comércio Vizinho.\n\nPosso ajudar você a:\n• Encontrar empresas próximas\n• Cadastrar seu negócio\n• Usar as funcionalidades do app\n\nComo posso ajudar?"
    };
    setMessages([initialMessage]);
    setHasActiveSession(true);
    setInput("");
    localStorage.setItem(CHAT_SESSION_KEY, "active");
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify([initialMessage]));
  };

  const clearSession = () => {
    localStorage.removeItem(CHAT_SESSION_KEY);
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    setMessages([]);
    setHasActiveSession(false);
    setInput("");
  };

  const handleEndSession = () => {
    clearSession();
    setShowEndSessionDialog(false);
    toast.info("Sessão de chat encerrada");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // SEMPRE iniciar uma nova sessão limpa quando abre
    if (open) {
      clearSession();
      startNewSession();
    }
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
      // Check for existing open conversation
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

      // Create new conversation
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

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Erro ao conectar com o assistente");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantContent;
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao conectar com o assistente. Tente novamente.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" className="gap-2 justify-start w-full">
      <Bot className="h-4 w-4" />
      Assistente
      {hasActiveSession && (
        <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </Button>
  );

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
                {/* Menu */}
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
                      Encerrar sessão
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetHeader>

          {/* Session info */}
          {hasActiveSession && (
            <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 text-xs text-green-700 dark:text-green-300 flex items-center justify-between flex-shrink-0">
              <span>Sessão ativa • {messages.length} mensagens</span>
              <button 
                onClick={() => setShowEndSessionDialog(true)}
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                Encerrar
              </button>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content || (
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce delay-100">.</span>
                        <span className="animate-bounce delay-200">.</span>
                      </span>
                    )}
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

      {/* End session dialog */}
      <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão de chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar a sessão, todo o histórico de mensagens será perdido. 
              Você poderá iniciar uma nova conversa a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar conversando</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndSession}
              className="bg-destructive hover:bg-destructive/90"
            >
              Encerrar sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
