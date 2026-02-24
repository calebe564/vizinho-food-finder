import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, Star, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HighlightRequest {
  id: string;
  establishment_id: string;
  user_id: string;
  image_url: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  admin_notes: string | null;
  establishment_name?: string;
}

export default function AdminHighlights() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HighlightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('highlight_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch establishment names
      if (data && data.length > 0) {
        const estIds = [...new Set(data.map(r => r.establishment_id))];
        const { data: establishments } = await supabase
          .from('establishments')
          .select('id, name')
          .in('id', estIds);

        const estMap = new Map(establishments?.map(e => [e.id, e.name]) || []);
        const enriched = data.map(r => ({
          ...r,
          establishment_name: estMap.get(r.establishment_id) || 'Desconhecido',
        }));
        setRequests(enriched as HighlightRequest[]);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching highlight requests:', err);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApprove = async (requestId: string, establishmentId: string) => {
    if (!user) return;
    setProcessing(requestId);
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

      const { error: updateError } = await supabase
        .from('highlight_requests')
        .update({
          status: 'approved',
          reviewed_at: now.toISOString(),
          reviewed_by: user.id,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          admin_notes: adminNotes[requestId] || null,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Activate highlight on establishment
      const { error: estError } = await supabase
        .from('establishments')
        .update({ is_destaque: true })
        .eq('id', establishmentId);

      if (estError) throw estError;

      toast.success('Destaque aprovado e ativado!');
      fetchRequests();
    } catch (err) {
      console.error('Error approving highlight:', err);
      toast.error('Erro ao aprovar destaque');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('highlight_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_notes: adminNotes[requestId] || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitação recusada');
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting highlight:', err);
      toast.error('Erro ao recusar solicitação');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500" />
          Solicitações de Destaque
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovados' : f === 'rejected' ? 'Recusados' : 'Todos'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">{req.establishment_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(req.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                {/* Image preview */}
                <div
                  className="rounded-xl overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewImage(req.image_url)}
                >
                  <img src={req.image_url} alt="Arte do destaque" className="w-full h-auto max-h-48 object-cover" />
                </div>

                {req.status === 'pending' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Notas do administrador (opcional)"
                      value={adminNotes[req.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(req.id, req.establishment_id)}
                        disabled={processing === req.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processing === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Aprovar (90 dias)
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(req.id)}
                        disabled={processing === req.id}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                )}

                {req.status === 'approved' && req.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Expira em: {new Date(req.expires_at).toLocaleDateString('pt-BR')}
                  </p>
                )}

                {req.admin_notes && (
                  <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">
                    📝 {req.admin_notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview da arte</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
