import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Clock, 
  FileText,
  User,
  Hash,
  Calendar,
  Briefcase,
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Claim {
  id: string;
  cnpj: string;
  status: string;
  created_at: string;
  user_id: string;
  establishment_id: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // Private requester data
  requester_name: string | null;
  requester_whatsapp: string | null;
  requester_email: string | null;
  requester_role: string | null;
  // Enriched data
  user_email?: string;
  user_name?: string;
  establishment_name?: string;
}

export default function AdminClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data: claimsData, error: claimsError } = await supabase
        .from("establishment_claims")
        .select("*")
        .order("created_at", { ascending: false });

      if (claimsError) throw claimsError;

      if (claimsData) {
        // Fetch user profiles and establishment names
        const enrichedClaims = await Promise.all(
          claimsData.map(async (claim) => {
            // Get user profile
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("user_id", claim.user_id)
              .single();

            // Get establishment name if exists
            let establishmentName = null;
            if (claim.establishment_id) {
              const { data: estData } = await supabase
                .from("establishments")
                .select("name")
                .eq("id", claim.establishment_id)
                .single();
              establishmentName = estData?.name;
            }

            return {
              ...claim,
              user_email: profileData?.email || "Email não encontrado",
              user_name: profileData?.full_name || "Usuário",
              establishment_name: establishmentName,
            };
          })
        );

        setClaims(enrichedClaims);
      }
    } catch (error) {
      console.error("Erro ao buscar reivindicações:", error);
      toast.error("Erro ao carregar reivindicações");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (claim: Claim, action: "approve" | "reject") => {
    setSelectedClaim(claim);
    setActionType(action);
    setAdminNotes("");
  };

  const confirmAction = async () => {
    if (!selectedClaim || !actionType || !user) return;

    setProcessing(selectedClaim.id);

    try {
      const newStatus = actionType === "approve" ? "approved" : "rejected";

      // Update claim status
      const { error: updateError } = await supabase
        .from("establishment_claims")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedClaim.id);

      if (updateError) throw updateError;

      // If approved, link user to establishment
      if (actionType === "approve" && selectedClaim.establishment_id) {
        // Check if user already has a link
        const { data: existingLink } = await supabase
          .from("user_establishments")
          .select("id")
          .eq("user_id", selectedClaim.user_id)
          .eq("establishment_id", selectedClaim.establishment_id)
          .single();

        if (!existingLink) {
          // Create link between user and establishment
          const { error: linkError } = await supabase
            .from("user_establishments")
            .insert({
              user_id: selectedClaim.user_id,
              establishment_id: selectedClaim.establishment_id,
              role: "owner",
              created_by: user.id,
            });

          if (linkError) throw linkError;
        }

        // Ensure user has empresario role (add if not exists, don't overwrite other roles)
        const { data: hasEmpresarioRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", selectedClaim.user_id)
          .eq("role", "empresario")
          .maybeSingle();

        if (!hasEmpresarioRole) {
          await supabase.from("user_roles").insert({
            user_id: selectedClaim.user_id,
            role: "empresario",
          });
        }
      }

      toast.success(
        actionType === "approve"
          ? "Reivindicação aprovada com sucesso!"
          : "Reivindicação rejeitada"
      );

      // Refresh claims list
      fetchClaims();
    } catch (error) {
      console.error("Erro ao processar reivindicação:", error);
      toast.error("Erro ao processar reivindicação");
    } finally {
      setProcessing(null);
      setSelectedClaim(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  };

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const processedClaims = claims.filter((c) => c.status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reivindicações de Empresas | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Reivindicações de Empresas</h2>
          <p className="text-muted-foreground">
            Gerencie as solicitações de reivindicação de empresas por CNPJ
          </p>
        </div>

        {/* Pending Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pendentes ({pendingClaims.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingClaims.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma reivindicação pendente
              </p>
            ) : (
              <div className="space-y-4">
                {pendingClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 border rounded-xl bg-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {claim.requester_name || claim.user_name}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ({claim.requester_email || claim.user_email})
                          </span>
                        </div>
                        {claim.requester_whatsapp && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            📱 WhatsApp: {claim.requester_whatsapp}
                          </div>
                        )}
                        {claim.requester_role && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            Cargo: <span className="capitalize">{claim.requester_role}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            CNPJ: {formatCNPJ(claim.cnpj)}
                          </span>
                        </div>
                        {claim.establishment_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{claim.establishment_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Solicitado em{" "}
                            {format(new Date(claim.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleAction(claim, "approve")}
                        disabled={processing === claim.id}
                      >
                        {processing === claim.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleAction(claim, "reject")}
                        disabled={processing === claim.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Claims */}
        {processedClaims.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Histórico ({processedClaims.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 border rounded-xl bg-muted/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{claim.user_name}</span>
                          <span className="text-muted-foreground text-sm">
                            ({claim.user_email})
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          CNPJ: {formatCNPJ(claim.cnpj)}
                        </div>
                        {claim.establishment_name && (
                          <div className="text-sm">
                            Empresa: {claim.establishment_name}
                          </div>
                        )}
                        {claim.admin_notes && (
                          <div className="text-sm text-muted-foreground mt-2">
                            <strong>Notas:</strong> {claim.admin_notes}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>
                    {claim.reviewed_at && (
                      <div className="text-xs text-muted-foreground">
                        Processado em{" "}
                        {format(new Date(claim.reviewed_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedClaim && !!actionType}
        onOpenChange={() => {
          setSelectedClaim(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Aprovar Reivindicação"
                : "Rejeitar Reivindicação"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Ao aprovar, o usuário será vinculado à empresa e receberá permissões de gestão."
                : "Ao rejeitar, o usuário será notificado e poderá submeter uma nova solicitação."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p>
                <strong>Usuário:</strong> {selectedClaim?.user_name}
              </p>
              <p>
                <strong>CNPJ:</strong>{" "}
                {selectedClaim?.cnpj && formatCNPJ(selectedClaim.cnpj)}
              </p>
              {selectedClaim?.establishment_name && (
                <p>
                  <strong>Empresa:</strong> {selectedClaim.establishment_name}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">
                Notas do administrador (opcional)
              </label>
              <Textarea
                placeholder="Adicione observações sobre esta decisão..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClaim(null);
                setActionType(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAction}
              variant={actionType === "approve" ? "default" : "destructive"}
              disabled={!!processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
