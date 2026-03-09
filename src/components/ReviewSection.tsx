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
import { Loader2, Pencil, Trash2, MessageSquare } from 'lucide-react';
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
  user_name?: string;
}

interface ReviewSectionProps {
  establishmentId: string;
  ratingAverage?: number;
  ratingCount?: number;
}

export function ReviewSection({ establishmentId, ratingAverage = 0, ratingCount = 0 }: ReviewSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

      // Fetch user names
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

  // Check if user already reviewed
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
        if (error) throw error;
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

  const startEdit = (review: Review) => {
    setRating(review.rating);
    setComment(review.comment || '');
    setEditingId(review.id);
    setEditing(true);
  };

  const showForm = !userReview || editing;

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Avaliações
          </h2>
          <RatingBadge average={ratingAverage} count={ratingCount} />
        </div>

        {/* Review Form */}
        {user && showForm && (
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

        {user && userReview && !editing && (
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
            Nenhuma avaliação ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3 p-3 rounded-lg border">
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
                      {review.user_id === user?.id && (
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
