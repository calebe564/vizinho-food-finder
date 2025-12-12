import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Megaphone, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Advertisement {
  id: string;
  image: string;
  title: string | null;
  text: string | null;
  link: string | null;
  position: string;
  active: boolean;
  created_at: string;
}

const positionLabels: Record<string, string> = {
  top: "Topo da Home",
  middle: "Meio da Home",
  bottom: "Final da Home",
};

export default function AdminAdvertisements() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    image: null as File | null,
    title: "",
    text: "",
    link: "",
    position: "top",
  });

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      // Fetch all advertisements (including inactive) for admin
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      toast.error("Erro ao carregar propagandas");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image) {
      toast.error("Selecione uma imagem para a propaganda");
      return;
    }

    setSubmitting(true);

    try {
      // Upload image to storage
      const fileExt = formData.image.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `advertisements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("establishment-images")
        .upload(filePath, formData.image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("establishment-images")
        .getPublicUrl(filePath);

      // Insert advertisement
      const { error: insertError } = await supabase
        .from("advertisements")
        .insert({
          image: publicUrl,
          title: formData.title || null,
          text: formData.text || null,
          link: formData.link || null,
          position: formData.position,
        });

      if (insertError) throw insertError;

      toast.success("Propaganda criada com sucesso!");
      setDialogOpen(false);
      setFormData({ image: null, title: "", text: "", link: "", position: "top" });
      setImagePreview(null);
      fetchAdvertisements();
    } catch (error) {
      console.error("Error creating advertisement:", error);
      toast.error("Erro ao criar propaganda");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ active: !currentActive })
        .eq("id", id);

      if (error) throw error;
      
      setAdvertisements(prev => 
        prev.map(ad => ad.id === id ? { ...ad, active: !currentActive } : ad)
      );
      toast.success(currentActive ? "Propaganda desativada" : "Propaganda ativada");
    } catch (error) {
      console.error("Error toggling advertisement:", error);
      toast.error("Erro ao atualizar propaganda");
    }
  };

  const deleteAdvertisement = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta propaganda?")) return;

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setAdvertisements(prev => prev.filter(ad => ad.id !== id));
      toast.success("Propaganda excluída");
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Erro ao excluir propaganda");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Propagandas</h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Propaganda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Propaganda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Imagem *</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="ad-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="ad-image"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <span className="text-sm">Clique para enviar</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-title">Título (opcional)</Label>
                <Input
                  id="ad-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Promoção de verão"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-text">Texto (opcional)</Label>
                <Textarea
                  id="ad-text"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Descrição da propaganda..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-link">Link (opcional)</Label>
                <Input
                  id="ad-link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Posição na tela *</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="top">Topo da Home</SelectItem>
                    <SelectItem value="middle">Meio da Home</SelectItem>
                    <SelectItem value="bottom">Final da Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                {submitting ? "Salvando..." : "Criar Propaganda"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {advertisements.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma propaganda cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {advertisements.map((ad) => (
            <Card key={ad.id} className={`rounded-2xl overflow-hidden ${!ad.active ? "opacity-60" : ""}`}>
              <img src={ad.image} alt={ad.title || "Propaganda"} className="w-full h-40 object-cover" />
              <CardContent className="p-4 space-y-3">
                <div>
                  {ad.title && <h3 className="font-semibold">{ad.title}</h3>}
                  {ad.text && <p className="text-sm text-muted-foreground line-clamp-2">{ad.text}</p>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="px-2 py-1 bg-secondary rounded-lg">
                    {positionLabels[ad.position]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ad.active}
                      onCheckedChange={() => toggleActive(ad.id, ad.active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAdvertisement(ad.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
