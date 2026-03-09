import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Plus, Edit, Trash2, Loader2, ImageIcon, Calendar } from 'lucide-react';
import { PromotionDialog } from './PromotionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PromotionManagementSectionProps {
  establishmentId: string;
}

interface PromotionProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images: unknown;
  is_promotion: boolean;
  promotion_description: string | null;
  promotion_expiration: string | null;
}

export function PromotionManagementSection({ establishmentId }: PromotionManagementSectionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PromotionProduct | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions', establishmentId],
    queryFn: async () => {
      // First, run cleanup of expired promotions
      await supabase.rpc('cleanup_expired_promotions');
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, images, is_promotion, promotion_description, promotion_expiration')
        .eq('establishment_id', establishmentId)
        .eq('is_promotion', true)
        .order('name');
      if (error) throw error;
      return (data || []) as PromotionProduct[];
    },
    enabled: !!establishmentId,
  });

  const handleRemovePromotion = async (productId: string) => {
    setRemovingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_promotion: false, promotion_description: null, promotion_expiration: null })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Promoção removida!');
      queryClient.invalidateQueries({ queryKey: ['promotions', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment-products-for-promo', establishmentId] });
    } catch (error) {
      console.error('Error removing promotion:', error);
      toast.error('Erro ao remover promoção.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['establishment-products-for-promo', establishmentId] });
  };

  const getDisplayImage = (product: PromotionProduct) => {
    if (product.images && Array.isArray(product.images) && (product.images as string[]).length > 0) {
      return (product.images as string[])[0];
    }
    return product.image;
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isExpired = (expiration: string | null) => {
    if (!expiration) return false;
    return new Date(expiration) < new Date();
  };

  return (
    <>
      <Card className="border-0 shadow-elevated rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            Promoções
          </CardTitle>
          <CardDescription>
            Crie promoções para seus produtos e atraia mais clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Flame className="h-4 w-4 mr-2" />
            Criar Promoção
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Nenhuma promoção ativa.</p>
              <p className="text-xs mt-1">Clique no botão acima para criar uma promoção.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Promoções ativas ({promotions.length})</p>
              {promotions.map((product) => {
                const img = getDisplayImage(product);
                const expired = isExpired(product.promotion_expiration);
                return (
                  <Card key={product.id} className={`p-3 ${expired ? 'opacity-60' : 'border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      {img ? (
                        <img src={img} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-primary font-semibold">{formatPrice(product.price)}</p>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">
                          {product.promotion_description}
                        </p>
                        {product.promotion_expiration && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className={`text-xs ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {expired ? 'Expirada em' : 'Válida até'}: {new Date(product.promotion_expiration).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {expired && (
                          <Badge variant="outline" className="text-xs mt-1 text-destructive border-destructive/30">
                            Expirada
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingProduct(product);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover promoção?</AlertDialogTitle>
                              <AlertDialogDescription>
                                A promoção de "{product.name}" será removida. O produto continuará cadastrado normalmente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemovePromotion(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {removingId === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Remover'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PromotionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        establishmentId={establishmentId}
        editingProduct={editingProduct}
        onSuccess={handleSuccess}
      />
    </>
  );
}
