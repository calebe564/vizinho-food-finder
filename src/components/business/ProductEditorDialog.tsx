import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSaveProduct } from '@/hooks/useMerchantProducts';
import { uploadPublicImage } from '@/lib/imageUpload';
import {
  PRODUCT_LIMITS,
  productSchema,
  toFormValues,
  type MerchantProduct,
  type ProductFormValues,
} from '@/lib/products';

interface ProductEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  /** Produto a editar; vazio para cadastrar um novo. */
  product?: MerchantProduct | null;
  /** Categorias já usadas, para sugerir. */
  categorySuggestions?: string[];
}

export function ProductEditorDialog({ open, onOpenChange, establishmentId, product, categorySuggestions = [] }: ProductEditorDialogProps) {
  const isEditing = !!product;
  const save = useSaveProduct(establishmentId);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image ?? null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'variations' });
  const hasVariations = form.watch('hasVariations');

  // abre sempre com os dados do produto certo
  useEffect(() => {
    if (open) {
      form.reset(toFormValues(product));
      setImageUrl(product?.image ?? null);
    }
  }, [open, product, form]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await uploadPublicImage(file, 'products'));
      toast.success('Imagem carregada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      await save.mutateAsync({ values, imageUrl, existing: product });
      toast.success(isEditing ? 'Produto atualizado' : 'Produto adicionado');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o produto.');
    }
  };

  const datalistId = 'categorias-do-produto';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar produto' : 'Adicionar produto'}</DialogTitle>
          <DialogDescription>Fotos e preços ajudam o cliente a decidir. Promoções são criadas na seção "Promoções".</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Foto do produto</Label>
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <img src={imageUrl} alt="Foto do produto" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center" aria-hidden="true">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="foto-produto" className="inline-flex">
                    <span className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {imageUrl ? 'Trocar foto' : 'Enviar foto'}
                    </span>
                  </Label>
                  <input id="foto-produto" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImage} disabled={uploading} />
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 5 MB.</p>
                  {imageUrl && (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-destructive" onClick={() => setImageUrl(null)}>
                      Remover foto
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Pão francês" maxLength={PRODUCT_LIMITS.name} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={PRODUCT_LIMITS.description} placeholder="Ingredientes, tamanho, observações..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria do produto</FormLabel>
                  <FormControl>
                    <Input list={datalistId} maxLength={PRODUCT_LIMITS.category} placeholder="Ex.: Bebidas, Pizzas, Corte..." {...field} />
                  </FormControl>
                  <datalist id={datalistId}>
                    {categorySuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasVariations"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Tem variações (tamanhos, sabores...)</FormLabel>
                    <p className="text-xs text-muted-foreground">Cada variação tem o seu preço.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {!hasVariations ? (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço *</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0,00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-3">
                <Label>Variações *</Label>
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`variations.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Ex.: Grande" maxLength={PRODUCT_LIMITS.variationName} aria-label={`Nome da variação ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variations.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label={`Remover variação ${index + 1}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {fields.length < PRODUCT_LIMITS.variations && (
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', price: 0 })}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar variação
                  </Button>
                )}
                {form.formState.errors.variations?.message && (
                  <p className="text-sm text-destructive" role="alert">{form.formState.errors.variations.message}</p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Disponível agora</FormLabel>
                    <p className="text-xs text-muted-foreground">Desligue se acabou: ele deixa de aparecer nas buscas.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending || uploading}>
                {save.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar produto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
