import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Eye, Edit, Clock, CheckCircle, XCircle, Package, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductVariation {
  name: string;
  price: number;
}

interface Product {
  name: string;
  price: number;
  description?: string;
  variations?: ProductVariation[];
}

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
  schedule: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  products_json: Product[] | null;
  profile_image: string | null;
}

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

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({
  value,
  label,
}));

export default function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRequest, setEditedRequest] = useState<Partial<Request>>({});
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('establishment_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'establishment_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("establishment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse products_json properly
      const parsedData = (data || []).map(item => ({
        ...item,
        products_json: Array.isArray(item.products_json) ? item.products_json as unknown as Product[] : null
      }));
      
      setRequests(parsedData);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: Request) => {
    try {
      // Criar estabelecimento com todos os dados
      const { data: establishment, error: establishmentError } = await supabase
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
          schedule: request.schedule || "Seg-Sex: 08:00-18:00",
          profile_image: request.profile_image,
          latitude: -19.9167,
          longitude: -43.9345,
          active: true,
        }])
        .select()
        .single();

      if (establishmentError) throw establishmentError;

      // Se houver produtos, criar na tabela products
      if (request.products_json && request.products_json.length > 0 && establishment) {
        for (const product of request.products_json) {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .insert([{
              establishment_id: establishment.id,
              name: product.name,
              price: product.price,
              description: product.description || null,
            }])
            .select()
            .single();

          if (productError) {
            console.error("Error creating product:", productError);
            continue;
          }

          // Se houver variações, criar na tabela product_variations
          if (product.variations && product.variations.length > 0 && productData) {
            for (const variation of product.variations) {
              await supabase
                .from("product_variations")
                .insert([{
                  product_id: productData.id,
                  name: variation.name,
                  price: variation.price,
                }]);
            }
          }
        }
      }

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from("establishment_requests")
        .update({ 
          status: "approved",
          admin_notes: notes || "Solicitação aprovada pelo administrador" 
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      toast.success("Empresa aprovada e cadastrada com sucesso!");
      setSelectedRequest(null);
      setNotes("");
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Erro ao aprovar solicitação");
    }
  };

  const handleReject = async (request: Request) => {
    if (!rejectReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição");
      return;
    }

    try {
      const { error } = await supabase
        .from("establishment_requests")
        .update({ 
          status: "rejected",
          admin_notes: rejectReason 
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Solicitação rejeitada");
      setSelectedRequest(null);
      setShowRejectDialog(false);
      setRejectReason("");
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Erro ao rejeitar solicitação");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from("establishment_requests")
        .update({
          name: editedRequest.name,
          category: editedRequest.category as any,
          neighborhood: editedRequest.neighborhood,
          address: editedRequest.address,
          phone: editedRequest.phone,
          whatsapp: editedRequest.whatsapp,
          description: editedRequest.description,
          external_link: editedRequest.external_link,
          schedule: editedRequest.schedule,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso!");
      setIsEditing(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast.error("Erro ao atualizar dados");
    }
  };

  const openReviewDialog = (request: Request) => {
    setSelectedRequest(request);
    setEditedRequest({ ...request });
    setNotes(request.admin_notes || "");
    setIsEditing(false);
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const RequestCard = ({ request, showActions = true }: { request: Request; showActions?: boolean }) => (
    <Card key={request.id} className={request.status !== "pending" ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {request.profile_image && (
              <img 
                src={request.profile_image} 
                alt={request.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <CardTitle className="text-lg">{request.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{categoryLabels[request.category]}</Badge>
                <Badge variant="outline">{request.neighborhood}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <Clock className="inline h-3 w-3 mr-1" />
                {formatDate(request.created_at)}
              </p>
            </div>
          </div>
          <Badge 
            variant={
              request.status === "pending" ? "default" : 
              request.status === "approved" ? "default" : 
              "destructive"
            }
            className={
              request.status === "approved" ? "bg-green-500 hover:bg-green-600" : ""
            }
          >
            {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
            {request.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
            {request.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
            {request.status === "pending" ? "Pendente" : 
             request.status === "approved" ? "Aprovada" : "Rejeitada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm mb-4">
          <p><strong>Endereço:</strong> {request.address}</p>
          <p><strong>Telefone:</strong> {request.phone}</p>
          {request.whatsapp && <p><strong>WhatsApp:</strong> {request.whatsapp}</p>}
          {request.schedule && <p><strong>Horário:</strong> {request.schedule}</p>}
          
          {/* Produtos */}
          {request.products_json && request.products_json.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="font-medium flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                Produtos ({request.products_json.length})
              </p>
              <div className="grid gap-2">
                {request.products_json.slice(0, 3).map((product, idx) => (
                  <div key={idx} className="text-xs bg-muted/50 p-2 rounded">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatPrice(product.price)}
                    </span>
                    {product.variations && product.variations.length > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({product.variations.length} variações)
                      </span>
                    )}
                  </div>
                ))}
                {request.products_json.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{request.products_json.length - 3} produtos...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notas administrativas */}
          {request.admin_notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-muted-foreground">
                <strong>Observações do Admin:</strong> {request.admin_notes}
              </p>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openReviewDialog(request)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {request.status === "pending" ? "Revisar" : "Ver Detalhes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Solicitações de Cadastro</h2>
        <p className="text-muted-foreground">
          Gerencie as solicitações públicas de cadastro de empresas
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprovadas ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejeitadas ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  Nenhuma solicitação pendente
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="grid gap-4">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  Nenhuma solicitação aprovada
                </CardContent>
              </Card>
            ) : (
              approvedRequests.map((request) => (
                <RequestCard key={request.id} request={request} showActions={true} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="grid gap-4">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  Nenhuma solicitação rejeitada
                </CardContent>
              </Card>
            ) : (
              rejectedRequests.map((request) => (
                <RequestCard key={request.id} request={request} showActions={true} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Revisão/Edição */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null);
        setIsEditing(false);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {isEditing ? "Editar Solicitação" : "Detalhes da Solicitação"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? "Edite os dados antes de aprovar" 
                    : "Analise os detalhes e tome uma ação"}
                </DialogDescription>
              </div>
              {selectedRequest?.status === "pending" && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedRequest && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Logo */}
                {selectedRequest.profile_image && (
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedRequest.profile_image} 
                      alt={selectedRequest.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Logo da empresa
                      </p>
                    </div>
                  </div>
                )}

                {/* Dados principais */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    {isEditing ? (
                      <Input
                        value={editedRequest.name || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">{selectedRequest.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    {isEditing ? (
                      <Select
                        value={editedRequest.category}
                        onValueChange={(value) => setEditedRequest({ ...editedRequest, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">
                        {categoryLabels[selectedRequest.category]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    {isEditing ? (
                      <Input
                        value={editedRequest.neighborhood || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, neighborhood: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">{selectedRequest.neighborhood}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    {isEditing ? (
                      <Input
                        value={editedRequest.phone || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">{selectedRequest.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    {isEditing ? (
                      <Input
                        value={editedRequest.whatsapp || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, whatsapp: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">
                        {selectedRequest.whatsapp || "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Horário</Label>
                    {isEditing ? (
                      <Input
                        value={editedRequest.schedule || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, schedule: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">
                        {selectedRequest.schedule || "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Endereço</Label>
                    {isEditing ? (
                      <Input
                        value={editedRequest.address || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, address: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">{selectedRequest.address}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Descrição</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedRequest.description || ""}
                        onChange={(e) => setEditedRequest({ ...editedRequest, description: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded">
                        {selectedRequest.description || "Não informada"}
                      </p>
                    )}
                  </div>

                  {selectedRequest.external_link && (
                    <div className="col-span-2 space-y-2">
                      <Label>Link Externo</Label>
                      {isEditing ? (
                        <Input
                          value={editedRequest.external_link || ""}
                          onChange={(e) => setEditedRequest({ ...editedRequest, external_link: e.target.value })}
                        />
                      ) : (
                        <a 
                          href={selectedRequest.external_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm p-2 bg-muted rounded block text-primary hover:underline"
                        >
                          {selectedRequest.external_link}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Produtos */}
                {selectedRequest.products_json && selectedRequest.products_json.length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="flex items-center gap-2 mb-4">
                      <Package className="h-4 w-4" />
                      Produtos ({selectedRequest.products_json.length})
                    </Label>
                    <div className="grid gap-3">
                      {selectedRequest.products_json.map((product, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-muted-foreground">{product.description}</p>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {formatPrice(product.price)}
                            </Badge>
                          </div>
                          {product.variations && product.variations.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-muted">
                              <p className="text-xs text-muted-foreground mb-1">Variações:</p>
                              {product.variations.map((v, vIdx) => (
                                <div key={vIdx} className="text-sm flex justify-between">
                                  <span>{v.name}</span>
                                  <span className="text-muted-foreground">{formatPrice(v.price)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações (apenas para pendentes) */}
                {selectedRequest.status === "pending" && !isEditing && (
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Observações Administrativas (opcional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione observações sobre esta solicitação..."
                      rows={2}
                    />
                  </div>
                )}

                {/* Histórico/Status */}
                {selectedRequest.status !== "pending" && (
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Histórico</Label>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        {selectedRequest.status === "approved" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">
                          {selectedRequest.status === "approved" ? "Aprovada" : "Rejeitada"}
                        </span>
                      </div>
                      {selectedRequest.admin_notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedRequest.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 justify-end border-t pt-4">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar Edição
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        Salvar Alterações
                      </Button>
                    </>
                  ) : selectedRequest.status === "pending" ? (
                    <>
                      <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                        Cancelar
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowRejectDialog(true)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button 
                        onClick={() => handleApprove(selectedRequest)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                      Fechar
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Esta informação ficará registrada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Dados incompletos, empresa já cadastrada, informações inválidas..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedRequest && handleReject(selectedRequest)}
                disabled={!rejectReason.trim()}
              >
                <X className="mr-2 h-4 w-4" />
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
