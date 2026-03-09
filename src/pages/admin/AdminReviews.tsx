import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { toast } from "sonner";
import { Loader2, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminReviews() {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Enrich with user names and establishment names
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const estIds = [...new Set((data || []).map(r => r.establishment_id))];

      const [profilesRes, estsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
        supabase.from("establishments").select("id, name").in("id", estIds),
      ]);

      const nameMap = new Map(profilesRes.data?.map(p => [p.user_id, p.full_name]) || []);
      const estMap = new Map(estsRes.data?.map(e => [e.id, e.name]) || []);

      return (data || []).map(r => ({
        ...r,
        user_name: nameMap.get(r.user_id) || "Usuário",
        establishment_name: estMap.get(r.establishment_id) || "Empresa",
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação removida");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Erro ao remover avaliação"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Avaliações | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Avaliações</h2>
          <p className="text-muted-foreground">
            {reviews.length} avaliações no total
          </p>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{review.user_name}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="text-sm">{review.establishment_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} readOnly size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(review.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
