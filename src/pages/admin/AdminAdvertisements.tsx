import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Megaphone, Loader2, Edit, Eye, Monitor, Tablet, Smartphone, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Establishment {
  id: string;
  name: string;
}

interface Advertisement {
  id: string;
  image: string;
  title: string | null;
  text: string | null;
  link: string | null;
  position: string;
  size: string;
  behavior: string;
  display_order: number;
  active: boolean;
  created_at: string;
  establishment_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

const positionLabels: Record<string, string> = {
  top: "Topo",
  middle: "Meio",
  bottom: "Inferior",
  sidebar: "Lateral",
  between: "Entre seções",
};

const sizeLabels: Record<string, string> = {
  small: "Pequena",
  medium: "Média",
  large: "Grande",
};

const behaviorLabels: Record<string, string> = {
  static: "Padrão",
  fixed: "Fixa",
  floating: "Flutuante",
  carousel: "Rotativa",
};

export default function AdminAdvertisements() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    image: null as File | null,
    imageUrl: "",
    title: "",
    text: "",
    link: "",
    position: "top",
    size: "small",
    behavior: "static",
    display_order: 0,
    establishment_id: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adsRes, estRes] = await Promise.all([
        supabase
          .from("advertisements")
          .select("*")
          .order("position")
          .order("display_order"),
        supabase
          .from("establishments")
          .select("id, name")
          .eq("active", true)
          .order("name")
      ]);

      if (adsRes.data) setAdvertisements(adsRes.data);
      if (estRes.data) setEstablishments(estRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      image: null,
      imageUrl: "",
      title: "",
      text: "",
      link: "",
      position: "top",
      size: "small",
      behavior: "static",
      display_order: 0,
      establishment_id: "",
      start_date: "",
      end_date: "",
    });
    setImagePreview(null);
    setEditingAd(null);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      image: null,
      imageUrl: ad.image,
      title: ad.title || "",
      text: ad.text || "",
      link: ad.link || "",
      position: ad.position,
      size: ad.size || "small",
      behavior: ad.behavior || "static",
      display_order: ad.display_order || 0,
      establishment_id: ad.establishment_id || "",
      start_date: ad.start_date ? ad.start_date.split('T')[0] : "",
      end_date: ad.end_date ? ad.end_date.split('T')[0] : "",
    });
    setImagePreview(ad.image);
    setDialogOpen(true);
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

    if (!formData.image && !formData.imageUrl) {
      toast.error("Selecione uma imagem para a propaganda");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if provided
      if (formData.image) {
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

        imageUrl = publicUrl;
      }

      const adData = {
        image: imageUrl,
        title: formData.title || null,
        text: formData.text || null,
        link: formData.link || null,
        position: formData.position,
        size: formData.size,
        behavior: formData.behavior,
        display_order: formData.display_order,
        establishment_id: formData.establishment_id || null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      if (editingAd) {
        const { error } = await supabase
          .from("advertisements")
          .update(adData)
          .eq("id", editingAd.id);

        if (error) throw error;
        toast.success("Propaganda atualizada!");
      } else {
        const { error } = await supabase
          .from("advertisements")
          .insert(adData);

        if (error) throw error;
        toast.success("Propaganda criada!");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving advertisement:", error);
      toast.error("Erro ao salvar propaganda");
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

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ display_order: newOrder })
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  // Preview component
  const PreviewAd = () => {
    const sizeClasses = {
      small: { container: 'p-2.5', image: 'w-16 h-16' },
      medium: { container: 'p-3 md:p-4', image: 'w-20 h-20 md:w-24 md:h-24' },
      large: { container: 'p-4 md:p-6', image: 'w-24 h-24 md:w-32 md:h-32' },
    }[formData.size] || { container: 'p-2.5', image: 'w-16 h-16' };

    const deviceWidth = {
      desktop: 'w-full max-w-lg',
      tablet: 'w-80',
      mobile: 'w-64',
    }[previewDevice];

    return (
      <div className={`mx-auto ${deviceWidth} border rounded-xl bg-background p-2`}>
        <div className="text-xs text-muted-foreground text-center mb-2 flex items-center justify-center gap-2">
          {previewDevice === 'desktop' && <Monitor className="h-4 w-4" />}
          {previewDevice === 'tablet' && <Tablet className="h-4 w-4" />}
          {previewDevice === 'mobile' && <Smartphone className="h-4 w-4" />}
          {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)}
        </div>
        <div className="rounded-xl overflow-hidden bg-secondary/20">
          <div className={`flex items-center gap-3 ${sizeClasses.container}`}>
            <div className={`${sizeClasses.image} flex-shrink-0 rounded-lg overflow-hidden bg-muted`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  Imagem
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {formData.title && (
                <p className="text-sm font-medium text-foreground line-clamp-1">{formData.title}</p>
              )}
              {formData.text && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{formData.text}</p>
              )}
              {formData.link && (
                <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
                  Ver mais →
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group ads by position
  const adsByPosition = advertisements.reduce((acc, ad) => {
    if (!acc[ad.position]) acc[ad.position] = [];
    acc[ad.position].push(ad);
    return acc;
  }, {} as Record<string, Advertisement[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Propagandas</h1>
            <p className="text-sm text-muted-foreground">{advertisements.length} propagandas cadastradas</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Nova Propaganda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? "Editar Propaganda" : "Nova Propaganda"}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="config" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="config" className="flex-1">Configuração</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">Pré-visualização</TabsTrigger>
              </TabsList>
              
              <TabsContent value="config">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {/* Image */}
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

                  {/* Title and Text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-title">Título</Label>
                      <Input
                        id="ad-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Promoção de verão"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad-link">Link</Label>
                      <Input
                        id="ad-link"
                        type="url"
                        value={formData.link}
                        onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="https://..."
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad-text">Descrição</Label>
                    <Textarea
                      id="ad-text"
                      value={formData.text}
                      onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Descrição da propaganda..."
                      className="rounded-xl resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Position, Size, Behavior */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Posição *</Label>
                      <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="top">Topo</SelectItem>
                          <SelectItem value="middle">Meio</SelectItem>
                          <SelectItem value="bottom">Inferior</SelectItem>
                          <SelectItem value="sidebar">Lateral</SelectItem>
                          <SelectItem value="between">Entre seções</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tamanho *</Label>
                      <Select value={formData.size} onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="small">Pequena</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Comportamento *</Label>
                      <Select value={formData.behavior} onValueChange={(value) => setFormData(prev => ({ ...prev, behavior: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="static">Padrão</SelectItem>
                          <SelectItem value="carousel">Rotativa (carrossel)</SelectItem>
                          <SelectItem value="fixed">Fixa</SelectItem>
                          <SelectItem value="floating">Flutuante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Order and Establishment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-order">Ordem de exibição</Label>
                      <Input
                        id="ad-order"
                        type="number"
                        min={0}
                        value={formData.display_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">Menor número = aparece primeiro</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Empresa vinculada</Label>
                      <Select value={formData.establishment_id} onValueChange={(value) => setFormData(prev => ({ ...prev, establishment_id: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Nenhuma (opcional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover max-h-60">
                          <SelectItem value="">Nenhuma</SelectItem>
                          {establishments.map(est => (
                            <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-start">Data de início</Label>
                      <Input
                        id="ad-start"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad-end">Data de término</Label>
                      <Input
                        id="ad-end"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                    {submitting ? "Salvando..." : editingAd ? "Atualizar" : "Criar Propaganda"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4 space-y-4">
                <div className="flex justify-center gap-2">
                  <Button
                    variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('desktop')}
                    className="rounded-lg"
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('tablet')}
                    className="rounded-lg"
                  >
                    <Tablet className="h-4 w-4 mr-1" />
                    Tablet
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('mobile')}
                    className="rounded-lg"
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    Mobile
                  </Button>
                </div>
                <PreviewAd />
              </TabsContent>
            </Tabs>
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
        <div className="space-y-6">
          {Object.entries(adsByPosition).map(([position, ads]) => (
            <div key={position}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {positionLabels[position] || position}
                <Badge variant="secondary" className="font-normal">{ads.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map((ad) => (
                  <Card key={ad.id} className={`rounded-2xl overflow-hidden ${!ad.active ? "opacity-60" : ""}`}>
                    <div className="relative">
                      <img src={ad.image} alt={ad.title || "Propaganda"} className="w-full h-36 object-cover" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge className="text-[10px]">{sizeLabels[ad.size] || 'Pequena'}</Badge>
                        <Badge variant="outline" className="text-[10px] bg-background/80">
                          {behaviorLabels[ad.behavior] || 'Padrão'}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[10px]">
                          <GripVertical className="h-3 w-3 mr-0.5" />
                          {ad.display_order}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        {ad.title && <h3 className="font-semibold line-clamp-1">{ad.title}</h3>}
                        {ad.text && <p className="text-sm text-muted-foreground line-clamp-2">{ad.text}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ad.active}
                            onCheckedChange={() => toggleActive(ad.id, ad.active)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {ad.active ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(ad)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}