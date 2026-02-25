import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Star, Upload, Clock, CheckCircle, XCircle, ImageIcon } from 'lucide-react';

interface HighlightRequestSectionProps {
  establishmentId: string;
}

interface HighlightRequest {
  id: string;
  status: string;
  image_url: string;
  created_at: string;
  starts_at: string | null;
  expires_at: string | null;
  admin_notes: string | null;
}

const REQUIRED_WIDTH = 1200;
const REQUIRED_HEIGHT = 400;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function HighlightRequestSection({ establishmentId }: HighlightRequestSectionProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HighlightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('highlight_requests')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data as HighlightRequest[]);
      }
    } catch (err) {
      console.error('Error fetching highlight requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [establishmentId, user]);

  const validateImage = (file: File): Promise<{ valid: boolean; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({ valid: img.width === REQUIRED_WIDTH && img.height === REQUIRED_HEIGHT, width: img.width, height: img.height });
      };
      img.onerror = () => resolve({ valid: false, width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setImageError('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    // Validate extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setImageError('Extensão de arquivo inválida.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 5MB.`);
      return;
    }

    const { valid, width, height } = await validateImage(file);

    if (!valid) {
      setImageError(`Imagem com ${width}x${height}px. O tamanho exigido é ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px.`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) {
      toast.error('Selecione uma imagem antes de enviar.');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload image
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `highlights/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('establishment-images')
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da imagem. Tente novamente.');
        return;
      }

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('establishment-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        toast.error('Erro ao obter URL da imagem.');
        return;
      }

      // Step 3: Create highlight request
      const { error: insertError } = await supabase
        .from('highlight_requests')
        .insert({
          establishment_id: establishmentId,
          user_id: user.id,
          image_url: urlData.publicUrl,
          status: 'pending',
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Erro ao criar solicitação. Verifique suas permissões.');
        return;
      }

      toast.success('Solicitação enviada com sucesso!');
      setSelectedFile(null);
      setPreviewUrl(null);
      // Reset file input
      const input = document.getElementById('highlight-upload') as HTMLInputElement;
      if (input) input.value = '';
      fetchRequests();
    } catch (error) {
      console.error('Error submitting highlight request:', error);
      toast.error('Erro inesperado ao enviar solicitação.');
    } finally {
      setUploading(false);
    }
  };

  const hasPending = requests.some(r => r.status === 'pending');
  const activeHighlight = requests.find(r => r.status === 'approved' && r.expires_at && new Date(r.expires_at) > new Date());

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (status === 'approved' && expiresAt && new Date(expiresAt) < new Date()) {
      return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Expirado</Badge>;
    }
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-elevated rounded-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Destaque Promocional */}
      <Card className="border-0 shadow-elevated rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Destaque
          </CardTitle>
          <CardDescription>
            Solicite o destaque da sua empresa e aumente sua visibilidade na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeHighlight ? (
            <div className="space-y-3">
              <div className="bg-green-500/5 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-medium text-green-700 mb-2">✅ Destaque ativo</p>
                <p className="text-xs text-muted-foreground">
                  Expira em: {new Date(activeHighlight.expires_at!).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border">
                <img src={activeHighlight.image_url} alt="Destaque ativo" className="w-full h-auto" />
              </div>
            </div>
          ) : hasPending ? (
            <div className="bg-amber-500/5 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-700">⏳ Solicitação em análise</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sua solicitação será analisada em até 30 minutos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Fazer Upload de Imagem</p>
                <p>Tamanho exigido: <strong>{REQUIRED_WIDTH}x{REQUIRED_HEIGHT}px</strong></p>
                <p className="text-xs mt-1">Formatos aceitos: JPG, PNG, WEBP</p>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="highlight-upload"
              />
              <label htmlFor="highlight-upload">
                <Button asChild variant="outline" className="w-full">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Imagem
                  </span>
                </Button>
              </label>

              {imageError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">❌ {imageError}</p>
                </div>
              )}

              {previewUrl && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Seu destaque ficará assim:</p>
                  <div className="rounded-xl overflow-hidden border">
                    <img src={previewUrl} alt="Preview do destaque" className="w-full h-auto" />
                  </div>
                  <Button onClick={handleSubmit} disabled={uploading} className="w-full">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Solicitar Destaque
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de solicitações */}
      {requests.length > 0 && (
        <Card className="border-0 shadow-elevated rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Solicitações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-20 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img src={req.image_url} alt="Destaque" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  {req.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.admin_notes}</p>
                  )}
                </div>
                {getStatusBadge(req.status, req.expires_at)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
