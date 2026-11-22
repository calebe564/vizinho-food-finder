import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImageIcon, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useDeleteProduct, useMerchantProducts, useToggleAvailability } from '@/hooks/useMerchantProducts';
import { getPlanConfig, usePlanConfigs } from '@/hooks/usePlanConfig';
import { isAtProductLimit, productLimitLabel, productsRemaining } from '@/config/plans';
import { promoOf } from '@/lib/dbFields';
import { existingCategories, priceLabel, type MerchantProduct } from '@/lib/products';
import { ProductEditorDialog } from './ProductEditorDialog';

interface ProductsManagerProps {
  establishmentId: string;
}

export function ProductsManager({ establishmentId }: ProductsManagerProps) {
  const { data: products = [], isLoading, isError, refetch } = useMerchantProducts(establishmentId);
  const { data: planConfigs = [] } = usePlanConfigs();
  const toggle = useToggleAvailability(establishmentId);
  const remove = useDeleteProduct(establishmentId);

  const { data: planName } = useQuery({
    queryKey: ['establishment-plan', establishmentId],
    queryFn: async () => {
      const { data } = await supabase.from('establishments').select('plan').eq('id', establishmentId).maybeSingle();
      return data?.plan ?? 'gratuito';
    },
  });

  const [editing, setEditing] = useState<MerchantProduct | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MerchantProduct | null>(null);

  const plan = getPlanConfig(planConfigs, planName ?? 'gratuito');
  const used = products.length;
  const atLimit = isAtProductLimit(plan.max_products, used);
  const remaining = productsRemaining(plan.max_products, used);
  const percent = plan.max_products > 0 ? Math.min(100, Math.round((used / plan.max_products) * 100)) : 0;

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (product: MerchantProduct) => {
    setEditing(product);
    setEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Produto excluído');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o produto.');
    } finally {
      setToDelete(null);
    }
  };

  const changeAvailability = (product: MerchantProduct, available: boolean) => {
    toggle.mutate(
      { productId: product.id, available },
      {
        onSuccess: () => toast.success(available ? 'Produto disponível' : 'Produto marcado como indisponível'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <section aria-labelledby="produtos-titulo" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="produtos-titulo" className="text-lg font-semibold">Produtos</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <strong className="text-foreground">{used}</strong> de {productLimitLabel(plan.max_products)} produtos cadastrados
            {remaining !== null && <> · {remaining === 0 ? 'nenhum restante' : `${remaining} ${remaining === 1 ? 'restante' : 'restantes'}`}</>}
            {' '}· plano <strong className="text-foreground">{plan.display_label}</strong>
          </p>
        </div>
        <Button onClick={openNew} disabled={atLimit || isLoading} className="gap-1.5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar produto
        </Button>
      </div>

      {plan.max_products > 0 && (
        <Progress value={percent} aria-label={`${used} de ${plan.max_products} produtos usados`} className="h-2" />
      )}

      {atLimit && (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm" role="status">
          Você chegou ao limite de produtos do plano {plan.display_label}. Para cadastrar mais,{' '}
          <Link to="/painel/planos" className="text-primary underline underline-offset-2">
            veja os planos
          </Link>
          . Você ainda pode editar e excluir os produtos que já tem.
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Carregando produtos...</p>}

      {isError && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">Não deu para carregar os produtos agora.</p>
          <Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
        </div>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
            <p className="font-medium">Nenhum produto cadastrado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione produtos com foto e preço para o cliente encontrar.</p>
            <Button className="mt-4" onClick={openNew}>Adicionar o primeiro produto</Button>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-2">
        {products.map((product) => {
          const promo = promoOf(product);
          return (
            <li key={product.id}>
              <Card className={product.is_available ? '' : 'opacity-75'}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-medium truncate">{product.name}</p>
                      {promo.isActive && <Badge className="text-[10px]">Promoção</Badge>}
                      {!product.is_available && <Badge variant="secondary" className="text-[10px]">Indisponível</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {priceLabel(product)}
                      {product.category ? ` · ${product.category}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={(v) => changeAvailability(product, v)}
                      aria-label={`Disponível: ${product.name}`}
                      disabled={toggle.isPending}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label={`Editar ${product.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(product)} aria-label={`Excluir ${product.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <ProductEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        establishmentId={establishmentId}
        product={editing}
        categorySuggestions={existingCategories(products)}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" será removido da sua página e das buscas. Para só esconder por um tempo, use "Disponível" em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={remove.isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
