import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating, RatingLabel, RatingBadge } from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2, MessageSquare, Reply, Sparkles } from 'lucide-react';
import { aiAssist } from '@/lib/aiAssist';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  user_id: string;
  establishment_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  owner_reply: string | null;
  owner_reply_created_at: string | null;
  user_name?: string;
}

interface ReviewSectionProps {
  establishmentId: string;
  ratingAverage?: number;
  ratingCount?: number;
  isOwnerView?: boolean;
}

export function ReviewSection({ establishmentId, ratingAverage = 0, ratingCount = 0, isOwnerView = false }: ReviewSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAiLoading, setReplyAiLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Check if user is owner of this establishment
  const { data: isOwner = false } = useQuery({
    queryKey: ['is-owner', establishmentId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_establishments')
        .select('id')
        .eq('establishment_id', establishmentId)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!establishmentId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', establishmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return (data || []).map(r => ({
        ...r,
        user_name: nameMap.get(r.user_id) || 'Usuário',
      })) as Review[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const userReview = reviews.find(r => r.user_id === user?.id);

  // Create/Update review
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login necessário');
      if (rating === 0) throw new Error('Selecione uma avaliação');

      if (editingId) {
        const { error } = await supabase
          .from('reviews')
          .update({ rating, comment: comment || null, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({ user_id: user.id, establishment_id: establishmentId, rating, comment: comment || null });
        if (error) {
          if (error.message?.includes('própria empresa')) {
            throw new Error('Você não pode avaliar sua própria empresa.');
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Avaliação atualizada!' : 'Avaliação enviada!');
      setRating(0);
      setComment('');
      setEditing(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['reviews', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment', establishmentId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Delete review
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Avaliação removida');
      queryClient.invalidateQueries({ queryKey: ['reviews', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment', establishmentId] });
    },
    onError: () => toast.error('Erro ao remover avaliação'),
  });

  // Owner reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          owner_reply: reply, 
          owner_reply_created_at: new Date().toISOString() 
        } as any)
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resposta enviada!');
      setReplyingId(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['reviews', establishmentId] });
    },
    onError: () => toast.error('Erro ao enviar resposta'),
  });

  const startEdit = (review: Review) => {
    setRating(review.rating);
    setComment(review.comment || '');
    setEditingId(review.id);
    setEditing(true);
  };

  const canReview = user && !isOwner;
  const showForm = canReview && (!userReview || editing);

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {isOwnerView ? 'Avaliações da sua empresa' : 'Avaliações'}
          </h2>
          <RatingBadge average={ratingAverage} count={ratingCount} />
        </div>

        {/* Review Form - hidden for owners */}
        {showForm && (
          <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
            <p className="text-sm font-medium">
              {editingId ? 'Editar sua avaliação' : 'Deixe sua avaliação'}
            </p>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && <RatingLabel rating={rating} />}
            </div>
            <Textarea
              placeholder="Comentário (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => submitMutation.mutate()} 
                disabled={rating === 0 || submitMutation.isPending}
                size="sm"
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editingId ? 'Atualizar' : 'Enviar'}
              </Button>
              {editing && (
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditingId(null); setRating(0); setComment(''); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Faça login para avaliar esta empresa.
          </p>
        )}

        {user && isOwner && !isOwnerView && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Você é o proprietário desta empresa. Gerencie as avaliações no painel Minha Empresa.
          </p>
        )}

        {canReview && userReview && !editing && (
          <div className="text-sm text-muted-foreground">
            Você já avaliou esta empresa.{' '}
            <button className="text-primary hover:underline" onClick={() => startEdit(userReview)}>
              Editar avaliação
            </button>
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Nenhuma avaliação ainda. {!isOwner && 'Seja o primeiro!'}
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.filter(r => r.comment?.trim()).length >= 2 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                {summary ? (
                  <>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1"><Sparkles className="h-3 w-3" /> O que os clientes dizem</p>
                    <p className="text-sm text-foreground">{summary}</p>
                  </>
                ) : (
                  <button
                    className="text-sm text-primary font-medium flex items-center gap-1 disabled:opacity-60"
                    disabled={summaryLoading}
                    onClick={async () => {
                      setSummaryLoading(true);
                      try { setSummary(await aiAssist({ task: 'review_summary', establishmentId })); }
                      catch (e) { toast.error((e as Error).message); }
                      finally { setSummaryLoading(false); }
                    }}
                  >
                    {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ver resumo das avaliações com IA
                  </button>
                )}
              </div>
            )}
            {reviews.map((review) => (
              <div key={review.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(review.user_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{review.user_name}</span>
                        <StarRating value={review.rating} readOnly size="sm" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {review.user_id === user?.id && !isOwnerView && (
                          <>
                            <button onClick={() => startEdit(review)} className="p-1 hover:bg-muted rounded">
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(review.id)} className="p-1 hover:bg-muted rounded">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    )}
                  </div>
                </div>

                {/* Owner Reply */}
                {review.owner_reply && (
                  <div className="ml-11 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">Resposta da empresa</p>
                    <p className="text-sm text-muted-foreground">{review.owner_reply}</p>
                    {review.owner_reply_created_at && (
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {format(new Date(review.owner_reply_created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                )}

                {/* Reply button for owner */}
                {(isOwner || isOwnerView) && !review.owner_reply && (
                  <>
                    {replyingId === review.id ? (
                      <div className="ml-11 space-y-2">
                        <Textarea
                          placeholder="Escreva sua resposta..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          className="resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => replyMutation.mutate({ reviewId: review.id, reply: replyText })}
                            disabled={!replyText.trim() || replyMutation.isPending}
                          >
                            {replyMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            Enviar resposta
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-primary"
                            disabled={replyAiLoading}
                            onClick={async () => {
                              setReplyAiLoading(true);
                              try { setReplyText(await aiAssist({ task: 'review_reply', rating: review.rating, comment: review.comment || undefined })); }
                              catch (e) { toast.error((e as Error).message); }
                              finally { setReplyAiLoading(false); }
                            }}
                          >
                            {replyAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            Sugerir com IA
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReplyText(''); }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="ml-11 text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={() => { setReplyingId(review.id); setReplyText(''); }}
                      >
                        <Reply className="h-3 w-3" />
                        Responder
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
