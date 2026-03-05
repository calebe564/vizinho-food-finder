import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const variationSchema = z.object({
  name: z.string().min(1, 'Nome da variação obrigatório'),
  price: z.number().min(0.01, 'Preço deve ser maior que 0'),
});

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que 0'),
  hasVariations: z.boolean().default(false),
  variations: z.array(variationSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  isFromRequest: boolean;
  existingProducts: ProductJson[];
  editingProduct?: ProductJson | null;
  editingIndex?: number;
  onSuccess: (products: ProductJson[]) => void;
}

export interface ProductJson {
  name: string;
  price: number;
  image: string | null;
  description?: string;
  hasVariations?: boolean;
  variations?: { name: string; price: number }[];
}

export function ProductFormDialog({
  open,
  onOpenChange,
  establishmentId,
  isFromRequest,
  existingProducts,
  editingProduct,
  editingIndex,
  onSuccess,
}: ProductFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(editingProduct?.image || null);
  const isEditing = editingProduct !== null && editingIndex !== undefined;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingProduct?.name || '',
      description: editingProduct?.description || '',
      price: editingProduct?.price || 0,
      hasVariations: editingProduct?.hasVariations || false,
      variations: editingProduct?.variations || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variations',
  });

  const hasVariations = form.watch('hasVariations');

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: editingProduct.price,
        hasVariations: editingProduct.hasVariations || false,
        variations: editingProduct.variations || [],
      });
      setImageUrl(editingProduct.image);
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        hasVariations: false,
        variations: [],
      });
      setImageUrl(null);
    }
  }, [editingProduct, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('establishment-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('establishment-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Imagem carregada!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // Ensure variations have required fields
      const validVariations = data.hasVariations && data.variations 
        ? data.variations.filter(v => v.name && v.price > 0).map(v => ({ name: v.name, price: v.price }))
        : undefined;

      const newProduct: ProductJson = {
        name: data.name,
        price: data.price,
        image: imageUrl,
        description: data.description,
        hasVariations: data.hasVariations,
        variations: validVariations,
      };

      let updatedProducts: ProductJson[];
      
      if (isEditing && editingIndex !== undefined) {
        updatedProducts = [...existingProducts];
        updatedProducts[editingIndex] = newProduct;
      } else {
        updatedProducts = [...existingProducts, newProduct];
      }

      // Convert to JSON-compatible format
      const productsJson = JSON.parse(JSON.stringify(updatedProducts));

      const table = isFromRequest ? 'establishment_requests' : 'establishments';
      const { error } = await supabase
        .from(table)
        .update({ products_json: productsJson })
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success(isEditing ? 'Produto atualizado!' : 'Produto adicionado!');
      onSuccess(updatedProducts);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto do produto</Label>
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Produto"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="product-image-upload">
                    <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                      <span>
                        {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {imageUrl ? 'Trocar foto' : 'Adicionar foto'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: X-Burguer" {...field} />
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
                  <FormLabel>Descrição / Ingredientes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o produto..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Has Variations Switch */}
            <div className="flex items-center justify-between py-2">
              <Label>Possui variações de tamanho/sabor?</Label>
              <Switch
                checked={hasVariations}
                onCheckedChange={(checked) => form.setValue('hasVariations', checked)}
              />
            </div>

            {!hasVariations && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {hasVariations && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Variações</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', price: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`variations.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Ex: Grande" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variations.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="R$"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Adicione variações de tamanho ou sabor
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
