import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface InviteAdminDialogProps {
  establishmentId: string;
  establishmentName: string;
}

export function InviteAdminDialog({ establishmentId, establishmentName }: InviteAdminDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Digite um e-mail válido");
      return;
    }

    setLoading(true);
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (profileError || !profile) {
        toast.error("Usuário não encontrado. O e-mail precisa estar cadastrado no sistema.");
        return;
      }

      // Check if already admin
      const { data: existing } = await supabase
        .from("user_establishments")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("establishment_id", establishmentId)
        .maybeSingle();

      if (existing) {
        toast.info("Este usuário já é administrador desta empresa");
        return;
      }

      // Add as admin
      const { error: insertError } = await supabase
        .from("user_establishments")
        .insert({
          user_id: profile.user_id,
          establishment_id: establishmentId,
          role: "admin",
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      // Create conversation notification
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: profile.user_id,
          user_name: "Sistema",
          user_email: "sistema@comerciovizinho.com",
          city_neighborhood: "Sistema",
          category: "outro",
          status: "open",
        })
        .select("id")
        .single();

      if (!convError && conversation) {
        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_type: "admin",
          content: `Você agora é administrador da empresa "${establishmentName}". Acesse "ADM espaço empresa" no menu para gerenciar.`,
        });
      }

      toast.success(`Convite enviado para ${email}`);
      setEmail("");
      setOpen(false);
    } catch (error) {
      console.error("Error inviting admin:", error);
      toast.error("Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar administrador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Administrador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            O usuário convidado poderá editar as informações desta empresa.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail do usuário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <Button onClick={handleInvite} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Convite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
