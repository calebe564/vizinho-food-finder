import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Request {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  address: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  external_link: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("establishment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: Request) => {
    try {
      // Criar estabelecimento
      const { error: establishmentError } = await supabase
        .from("establishments")
        .insert([{
          name: request.name,
          category: request.category as any,
          neighborhood: request.neighborhood,
          address: request.address,
          phone: request.phone,
          whatsapp: request.whatsapp,
          description: request.description,
          external_link: request.external_link,
          schedule: "Seg-Sex: 08:00-18:00",
          latitude: -19.9167,
          longitude: -43.9345,
          active: true,
        }]);

      if (establishmentError) throw establishmentError;

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from("establishment_requests")
        .update({ 
          status: "approved",
          admin_notes: notes || null 
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      toast.success("Solicitação aprovada com sucesso!");
      setSelectedRequest(null);
      setNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Erro ao aprovar solicitação");
    }
  };

  const handleReject = async (request: Request) => {
    try {
      const { error } = await supabase
        .from("establishment_requests")
        .update({ 
          status: "rejected",
          admin_notes: notes || null 
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Solicitação rejeitada");
      setSelectedRequest(null);
      setNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Erro ao rejeitar solicitação");
    }
  };

  const categoryLabels: Record<string, string> = {
    restaurante: "Restaurante",
    lanchonete: "Lanchonete",
    padaria: "Padaria",
    supermercado: "Supermercado",
    açougue: "Açougue",
    hortifruti: "Hortifruti",
    pizzaria: "Pizzaria",
    hamburgueria: "Hamburgueria",
    bar: "Bar",
    cafe: "Café",
    outro: "Outro",
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  if (loading) {
    return <div className="flex justify-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Solicitações de Cadastro</h2>
        <p className="text-muted-foreground">
          Gerencie as solicitações públicas de cadastro de empresas
        </p>
      </div>

      {/* Solicitações Pendentes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pendentes ({pendingRequests.length})</h3>
        <div className="grid gap-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma solicitação pendente
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{request.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{categoryLabels[request.category]}</Badge>
                        <Badge variant="outline">{request.neighborhood}</Badge>
                      </div>
                    </div>
                    <Badge>Pendente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <p><strong>Endereço:</strong> {request.address}</p>
                    <p><strong>Telefone:</strong> {request.phone}</p>
                    {request.whatsapp && <p><strong>WhatsApp:</strong> {request.whatsapp}</p>}
                    {request.description && <p><strong>Descrição:</strong> {request.description}</p>}
                    {request.external_link && (
                      <p>
                        <strong>Link:</strong>{" "}
                        <a href={request.external_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {request.external_link}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setNotes(request.admin_notes || "");
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Revisar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Solicitações Processadas */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Processadas ({processedRequests.length})</h3>
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{request.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{categoryLabels[request.category]}</Badge>
                      </div>
                    </div>
                    <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                      {request.status === "approved" ? "Aprovada" : "Rejeitada"}
                    </Badge>
                  </div>
                </CardHeader>
                {request.admin_notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      <strong>Observações:</strong> {request.admin_notes}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Revisão */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Solicitação</DialogTitle>
            <DialogDescription>
              Analise os detalhes e aprove ou rejeite a solicitação
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nome:</strong>
                  <p>{selectedRequest.name}</p>
                </div>
                <div>
                  <strong>Categoria:</strong>
                  <p>{categoryLabels[selectedRequest.category]}</p>
                </div>
                <div>
                  <strong>Bairro:</strong>
                  <p>{selectedRequest.neighborhood}</p>
                </div>
                <div>
                  <strong>Telefone:</strong>
                  <p>{selectedRequest.phone}</p>
                </div>
                {selectedRequest.whatsapp && (
                  <div>
                    <strong>WhatsApp:</strong>
                    <p>{selectedRequest.whatsapp}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <strong>Endereço:</strong>
                  <p>{selectedRequest.address}</p>
                </div>
                {selectedRequest.description && (
                  <div className="col-span-2">
                    <strong>Descrição:</strong>
                    <p>{selectedRequest.description}</p>
                  </div>
                )}
                {selectedRequest.external_link && (
                  <div className="col-span-2">
                    <strong>Link Externo:</strong>
                    <p>
                      <a href={selectedRequest.external_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedRequest.external_link}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Observações Administrativas (opcional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta solicitação..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReject(selectedRequest)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Rejeitar
                </Button>
                <Button onClick={() => handleApprove(selectedRequest)}>
                  <Check className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
