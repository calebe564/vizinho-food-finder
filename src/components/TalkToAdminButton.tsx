import { MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function TalkToAdminButton() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast.info("Faça login para falar com a administração");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // Check for existing open conversation
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .maybeSingle();

      if (existingConversation) {
        navigate(`/conversas/${existingConversation.id}`);
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

      navigate(`/conversas/${newConversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erro ao iniciar conversa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="fixed bottom-24 right-6 z-40 gap-2 rounded-full shadow-lg bg-primary hover:bg-primary/90 px-4"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="hidden sm:inline">Falar com o ADM</span>
      <span className="sm:hidden">ADM</span>
    </Button>
  );
}
