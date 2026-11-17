import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EstablishmentPhoto {
  id: string;
  establishment_id: string;
  url: string;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all photos for an establishment
export function useEstablishmentPhotos(establishmentId: string | undefined) {
  return useQuery({
    queryKey: ['establishment-photos', establishmentId],
    queryFn: async () => {
      if (!establishmentId) return [];
      const { data, error } = await supabase
        .from('establishment_photos')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EstablishmentPhoto[];
    },
    enabled: !!establishmentId,
  });
}

// Fetch main photo for an establishment (for cards)
export function useMainPhoto(establishmentId: string | undefined) {
  return useQuery({
    queryKey: ['establishment-main-photo', establishmentId],
    queryFn: async () => {
      if (!establishmentId) return null;
      const { data, error } = await supabase
        .from('establishment_photos')
        .select('url')
        .eq('establishment_id', establishmentId)
        .eq('is_main', true)
        .maybeSingle();
      if (error) throw error;
      return data?.url || null;
    },
    enabled: !!establishmentId,
  });
}

// Batch fetch main photos for multiple establishments
export function useMainPhotosMap(establishmentIds: string[]) {
  return useQuery({
    queryKey: ['establishment-main-photos-batch', establishmentIds.sort().join(',')],
    queryFn: async () => {
      if (establishmentIds.length === 0) return {};
      const { data, error } = await supabase
        .from('establishment_photos')
        .select('establishment_id, url')
        .in('establishment_id', establishmentIds)
        .eq('is_main', true);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((p) => {
        map[p.establishment_id] = p.url;
      });
      return map;
    },
    enabled: establishmentIds.length > 0,
  });
}

// Add photos
export function useAddPhotos(establishmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `photos/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('establishment-images')
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('establishment-images')
          .getPublicUrl(fileName);
        urls.push(publicUrl);
      }

      // Insert into establishment_photos
      const rows = urls.map((url, i) => ({
        establishment_id: establishmentId,
        url,
        is_main: false,
      }));
      const { error } = await supabase.from('establishment_photos').insert(rows);
      if (error) throw error;
      return urls;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-photos', establishmentId] });
      toast.success('Fotos adicionadas com sucesso!');
    },
    onError: () => toast.error('Erro ao adicionar fotos'),
  });
}

// Set main photo
export function useSetMainPhoto(establishmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      // The DB trigger handles unsetting the previous main
      const { error } = await supabase
        .from('establishment_photos')
        .update({ is_main: true })
        .eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-photos', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment-main-photo', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment-main-photos-batch'] });
      toast.success('Foto principal atualizada!');
    },
    onError: () => toast.error('Erro ao definir foto principal'),
  });
}

// Delete photo — auto-promotes next photo to main if deleted was main
export function useDeletePhoto(establishmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, wasMain }: { photoId: string; wasMain: boolean }) => {
      const { error } = await supabase
        .from('establishment_photos')
        .delete()
        .eq('id', photoId);
      if (error) throw error;

      // If deleted photo was main, promote the oldest remaining photo
      if (wasMain) {
        const { data: remaining } = await supabase
          .from('establishment_photos')
          .select('id')
          .eq('establishment_id', establishmentId)
          .order('created_at', { ascending: true })
          .limit(1);
        if (remaining && remaining.length > 0) {
          await supabase
            .from('establishment_photos')
            .update({ is_main: true })
            .eq('id', remaining[0].id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-photos', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment-main-photo', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishment-main-photos-batch'] });
      toast.success('Foto removida!');
    },
    onError: () => toast.error('Erro ao remover foto'),
  });
}
