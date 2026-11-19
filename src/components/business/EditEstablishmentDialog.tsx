import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategorySelectItems } from '@/components/CategorySelectItems';
import type { Database } from '@/integrations/supabase/types';
import { websiteUrl, instagramUrl, mailtoUrl } from '@/lib/contactLinks';

type EstablishmentCategory = Database['public']['Enums']['establishment_category'];


const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  category: z.string().min(1, 'Selecione uma categoria'),
  category_2: z.string().optional(),
  category_3: z.string().optional(),
  phone: z.string().min(8, 'Telefone inválido'),
  whatsapp: z.string().optional(),
  website: z.string().max(200, 'Endereço do site muito longo').optional()
    .refine((v) => !v || !v.trim() || websiteUrl(v) !== null, 'Site inválido (ex.: www.minhaloja.com.br)'),
  instagram: z.string().max(100, 'Muito longo').optional()
    .refine((v) => !v || !v.trim() || instagramUrl(v) !== null, 'Instagram inválido (ex.: @minhaloja)'),
  contact_email: z.string().max(200, 'E-mail muito longo').optional()
    .refine((v) => !v || !v.trim() || mailtoUrl(v) !== null, 'E-mail inválido'),
  schedule: z.string().optional(),
  address: z.string().min(5, 'Endereço muito curto'),
  cnpj: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditEstablishmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  isFromRequest: boolean;
  initialData: {
    name: string;
    description: string | null;
    category: string;
    category_2?: string | null;
    category_3?: string | null;
    phone: string;
    whatsapp: string | null;
    website?: string | null;
    instagram?: string | null;
    contact_email?: string | null;
    schedule: string | null;
    address: string;
  };
  onSuccess: () => void;
}

export function EditEstablishmentDialog({
  open,
  onOpenChange,
  establishmentId,
  isFromRequest,
  initialData,
  onSuccess,
}: EditEstablishmentDialogProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description || '',
      category: initialData.category,
      category_2: initialData.category_2 || '',
      category_3: initialData.category_3 || '',
      phone: initialData.phone,
      whatsapp: initialData.whatsapp || '',
      website: initialData.website || '',
      instagram: initialData.instagram || '',
      contact_email: initialData.contact_email || '',
      schedule: initialData.schedule || '',
      address: initialData.address,
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const updateData = {
        name: data.name,
        description: data.description || null,
        category: data.category as EstablishmentCategory,
        category_2: data.category_2 || null,
        category_3: data.category_3 || null,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        schedule: data.schedule || null,
        address: data.address,
        // Site, Instagram e e-mail só existem na tabela de empresas (não na de solicitações).
        ...(isFromRequest
          ? {}
          : {
              website: websiteUrl(data.website) || null,
              instagram: instagramUrl(data.instagram) || null,
              contact_email: data.contact_email?.trim() || null,
            }),
      };

      const table = isFromRequest ? 'establishment_requests' : 'establishments';
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success('Informações atualizadas com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating establishment:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Informações da Empresa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da sua empresa" {...field} />
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
                  <FormLabel>Categoria principal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <CategorySelectItems />
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria 2 (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        <CategorySelectItems />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria 3 (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        <CategorySelectItems />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva sua empresa..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 0000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isFromRequest && (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Ficha da empresa (aparece na sua página)</p>
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site</FormLabel>
                      <FormControl>
                        <Input placeholder="www.minhaloja.com.br" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@minhaloja" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail de contato</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contato@minhaloja.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário de funcionamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Seg-Sex 08h-18h, Sáb 08h-12h" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
