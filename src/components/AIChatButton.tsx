import { MessageCircle, Send, X, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { toast } from "sonner";
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

type Message = { role: "user" | "assistant"; content: string };

const CHAT_SESSION_KEY = "ai_chat_session";
const CHAT_MESSAGES_KEY = "ai_chat_messages";

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar sessão existente ao inicializar
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

  // Salvar mensagens quando atualizadas
  useEffect(() => {
    if (hasActiveSession && messages.length > 0) {
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages, hasActiveSession]);

  // Scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewSession = () => {
    const initialMessage: Message = {
      role: "assistant",
      content: "Olá! Sou o assistente do Comércio Vizinho. Como posso ajudar você?"
    };
    setMessages([initialMessage]);
    setHasActiveSession(true);
    localStorage.setItem(CHAT_SESSION_KEY, "active");
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify([initialMessage]));
    setIsOpen(true);
    toast.success("Nova sessão de chat iniciada!");
  };

  const clearSession = () => {
    localStorage.removeItem(CHAT_SESSION_KEY);
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    setMessages([]);
    setHasActiveSession(false);
    setIsOpen(false);
    setInput("");
  };

  const handleEndSession = () => {
    clearSession();
    setShowEndSessionDialog(false);
    toast.info("Sessão de chat encerrada");
  };

  const handleFloatingButtonClick = () => {
    if (hasActiveSession) {
      // Se já tem sessão ativa, pergunta se quer encerrar ou continuar
      if (isOpen) {
        // Se chat está aberto, fecha
        setIsOpen(false);
      } else {
        // Se chat está fechado, abre
        setIsOpen(true);
      }
    } else {
      // Se não tem sessão, inicia uma nova
      startNewSession();
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
              // Ignora erros de parse
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

  return (
    <>
      {/* Botão flutuante */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Indicador de sessão ativa */}
        {hasActiveSession && !isOpen && (
          <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-md animate-pulse">
            Chat ativo
          </div>
        )}
        
        <Button
          onClick={handleFloatingButtonClick}
          size="lg"
          className={`rounded-full shadow-lg hover:shadow-xl transition-all h-14 w-14 p-0 ${
            hasActiveSession 
              ? "bg-green-500 hover:bg-green-600" 
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Chat window */}
      {isOpen && hasActiveSession && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Assistente Comércio Vizinho</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEndSessionDialog(true)}
                className="text-white hover:bg-white/10"
                title="Encerrar sessão"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10"
                title="Minimizar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Aviso de sessão */}
          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 text-xs text-green-700 dark:text-green-300 flex items-center justify-between">
            <span>Sessão ativa • {messages.length} mensagens</span>
            <button 
              onClick={() => setShowEndSessionDialog(true)}
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              Encerrar
            </button>
          </div>

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
                        ? "bg-blue-500 text-white"
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
          <div className="p-4 border-t">
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
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Dialog de confirmação para encerrar sessão */}
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
