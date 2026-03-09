import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Flame, ArrowRight, ArrowLeft, Check, Package, ImageIcon, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images: unknown;
  is_promotion: boolean;
  promotion_description: string | null;
  promotion_expiration: string | null;
}

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  editingProduct?: Product | null;
  onSuccess: () => void;
}

export function PromotionDialog({
  open,
  onOpenChange,
  establishmentId,
  editingProduct,
  onSuccess,
}: PromotionDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [description, setDescription] = useState('');
  const [expiration, setExpiration] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['establishment-products-for-promo', establishmentId],
    queryFn: async () => {
      // Only fetch products that exist and belong to this establishment
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, images, is_promotion, promotion_description, promotion_expiration')
        .eq('establishment_id', establishmentId)
        .order('name');
      if (error) throw error;
      
      // Filter out products with expired promotions client-side for display accuracy
      return (data || []).map(p => {
        if (p.is_promotion && p.promotion_expiration && new Date(p.promotion_expiration) < new Date()) {
          return { ...p, is_promotion: false, promotion_description: null, promotion_expiration: null };
        }
        return p;
      }) as Product[];
    },
    enabled: open && !!establishmentId,
    // Refetch when dialog opens to ensure fresh data
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (editingProduct) {
      setSelectedProduct(editingProduct);
      setDescription(editingProduct.promotion_description || '');
      setExpiration(editingProduct.promotion_expiration ? editingProduct.promotion_expiration.split('T')[0] : '');
      setStep(2);
    } else {
      setStep(1);
      setSelectedProduct(null);
      setDescription('');
      setExpiration('');
    }
  }, [editingProduct, open]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setDescription('');
    setExpiration('');
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedProduct || !description.trim()) {
      toast.error('Preencha a descrição da promoção.');
      return;
    }

    setSaving(true);
    try {
      // Validate: check if product still exists and belongs to this establishment
      const { data: productCheck, error: checkError } = await supabase
        .from('products')
        .select('id, establishment_id')
        .eq('id', selectedProduct.id)
        .eq('establishment_id', establishmentId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!productCheck) {
        toast.error('Este produto não existe mais ou foi removido.');
        onOpenChange(false);
        onSuccess(); // Refresh lists
        return;
      }

      const updateData: Record<string, unknown> = {
        is_promotion: true,
        promotion_description: description.trim(),
        promotion_expiration: expiration ? new Date(expiration + 'T23:59:59').toISOString() : null,
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProduct.id)
        .eq('establishment_id', establishmentId);

      if (error) throw error;

      toast.success('Promoção criada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Erro ao criar promoção.');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getDisplayImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && (product.images as string[]).length > 0) {
      return (product.images as string[])[0];
    }
    return product.image;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            {editingProduct ? 'Editar Promoção' : 'Criar Promoção'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 - Select product */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Selecione o produto que receberá a promoção:</p>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
                <p className="text-sm text-muted-foreground">Cadastre produtos primeiro na aba Produtos.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {products.map((product) => {
                  const img = getDisplayImage(product);
                  return (
                    <Card
                      key={product.id}
                      className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                        product.is_promotion ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''
                      }`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="flex items-center gap-3">
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
                          {product.is_promotion && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              <Flame className="h-3 w-3 mr-1" />
                              Em promoção
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Define promotion */}
        {step === 2 && selectedProduct && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              {getDisplayImage(selectedProduct) ? (
                <img src={getDisplayImage(selectedProduct)!} alt={selectedProduct.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-primary">{formatPrice(selectedProduct.price)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição da promoção *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: De R$30 por R$22, 20% de desconto, Leve 2 pague 1..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Descreva a promoção como quiser. Ex: "De R$30 por R$22", "20% de desconto", "Leve 2 pague 1"
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validade da promoção (opcional)
              </Label>
              <Input
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                Se definida, a promoção será removida automaticamente após esta data.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              {!editingProduct && (
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              <Button onClick={() => setStep(3)} disabled={!description.trim()} className="flex-1">
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 - Confirm */}
        {step === 3 && selectedProduct && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Confirme os dados da promoção:</p>

            <Card className="p-4 space-y-3 border-red-200 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-center gap-3">
                {getDisplayImage(selectedProduct) ? (
                  <img src={getDisplayImage(selectedProduct)!} alt={selectedProduct.name} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-bold">{selectedProduct.name}</p>
                  <p className="text-sm text-primary font-semibold">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Promoção:</p>
                  <p className="font-medium text-red-600 dark:text-red-400">{description}</p>
                </div>
                {expiration && (
                  <div>
                    <p className="text-xs text-muted-foreground">Válido até:</p>
                    <p className="font-medium">{new Date(expiration).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleConfirm} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Flame className="h-4 w-4 mr-2" />
                Confirmar Promoção
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
